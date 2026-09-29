import { randomBytes, createHash } from "node:crypto";
import type { PrismaService } from "../../integration/db/prisma.service.js";
import { env } from "../../config/env.js";
import { reserveResendEmailSlot } from "./email-verification.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TOKEN_TTL_MS = 60 * 60 * 1000;

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");
const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export const createEmailChangeToken = async (
  prisma: PrismaService,
  userId: string,
  newEmail: string
): Promise<string> => {
  const token = randomBytes(32).toString("base64url");
  await prisma.emailChangeToken.deleteMany({ where: { userId } });
  await prisma.emailChangeToken.create({
    data: {
      userId,
      newEmail,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS)
    }
  });
  return token;
};

export const consumeEmailChangeToken = async (prisma: PrismaService, token: string) => {
  const stored = await prisma.emailChangeToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!stored || stored.usedAt || stored.expiresAt <= new Date()) return null;
  await prisma.emailChangeToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } });
  return { userId: stored.userId, newEmail: stored.newEmail };
};

export const sendEmailChangeEmail = async (input: {
  to: string;
  token: string;
  fetcher?: typeof fetch;
}): Promise<"sent" | "unavailable"> => {
  if (!env.RESEND_ENABLED || !env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return "unavailable";
  if (!reserveResendEmailSlot()) return "unavailable";
  const url = `${env.OPSLENS_WEB_URL}/change-email?token=${encodeURIComponent(input.token)}`;
  try {
    const response = await (input.fetcher ?? fetch)(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [input.to],
        subject: "새 이메일 주소를 인증해 주세요",
        text: `새 이메일 주소를 인증하려면 다음 링크를 여세요: ${url}`,
        html: `<p>새 이메일 주소를 인증하려면 아래 링크를 여세요.</p><p><a href="${escapeHtml(url)}">이메일 주소 변경 확인</a></p>`
      })
    });
    return response.ok ? "sent" : "unavailable";
  } catch {
    return "unavailable";
  }
};
