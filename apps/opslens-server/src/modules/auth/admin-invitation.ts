import { randomBytes } from "node:crypto";
import type { PrismaService } from "../../integration/db/prisma.service.js";
import { env } from "../../config/env.js";
import { escapeHtml, hashToken, reserveResendEmailSlot } from "./email-verification.js";

const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export const buildAdminInvitationUrl = (token: string): string =>
  `${env.OPSLENS_WEB_URL}/accept-invite?token=${encodeURIComponent(token)}`;

export type AdminInvitationDelivery =
  | { sent: true }
  | { sent: false; reason: "disabled" | "missing-config" | "monthly-limit" | "provider-error" };

export const createAdminInvitationToken = async (
  prisma: PrismaService,
  input: { email: string; role: "admin" | "operator" | "viewer"; invitedBy: string }
): Promise<{ token: string; invitationId: string }> => {
  const token = randomBytes(32).toString("base64url");
  const invitation = await prisma.adminInvitation.create({
    data: {
      email: input.email,
      role: input.role,
      invitedBy: input.invitedBy,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS)
    }
  });
  return { token, invitationId: invitation.id };
};

export const consumeAdminInvitation = async (prisma: PrismaService, token: string) => {
  const invitation = await prisma.adminInvitation.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt <= new Date()) {
    return null;
  }
  return invitation;
};

export const sendAdminInvitationEmail = async (input: {
  to: string;
  token: string;
  fetcher?: typeof fetch;
}): Promise<AdminInvitationDelivery> => {
  if (!env.RESEND_ENABLED) return { sent: false, reason: "disabled" };
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return { sent: false, reason: "missing-config" };
  if (!reserveResendEmailSlot()) return { sent: false, reason: "monthly-limit" };

  const url = buildAdminInvitationUrl(input.token);
  try {
    const response = await (input.fetcher ?? fetch)(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [input.to],
        subject: "OpsLens 운영자 초대",
        text: `OpsLens 초대를 수락하려면 다음 링크를 여세요: ${url}`,
        html: `<p>OpsLens 초대를 수락하려면 아래 링크를 여세요.</p><p><a href="${escapeHtml(url)}">초대 수락</a></p>`
      })
    });
    if (!response.ok) return { sent: false, reason: "provider-error" };
    return { sent: true };
  } catch {
    return { sent: false, reason: "provider-error" };
  }
};
