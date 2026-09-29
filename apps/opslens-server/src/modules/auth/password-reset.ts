import { createHash, randomBytes } from "node:crypto";
import type { PrismaService } from "../../integration/db/prisma.service.js";
import { env } from "../../config/env.js";
import { reserveResendEmailSlot } from "./email-verification.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TOKEN_TTL_MS = 60 * 60 * 1000;

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export const createPasswordResetToken = async (prisma: PrismaService, userId: string): Promise<string> => {
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS)
    }
  });
  return token;
};

export const consumePasswordResetToken = async (prisma: PrismaService, token: string) => {
  const stored = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });
  if (!stored || stored.usedAt || stored.expiresAt <= new Date()) return null;
  await prisma.passwordResetToken.update({
    where: { id: stored.id },
    data: { usedAt: new Date() }
  });
  return { userId: stored.userId, email: stored.user.email };
};

export const sendPasswordResetEmail = async (input: {
  to: string;
  token: string;
  fetcher?: typeof fetch;
}): Promise<"sent" | "unavailable"> => {
  if (!env.RESEND_ENABLED || !env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return "unavailable";
  if (!reserveResendEmailSlot()) return "unavailable";
  const url = `${env.OPSLENS_WEB_URL}/reset-password?token=${encodeURIComponent(input.token)}`;
  try {
    const response = await (input.fetcher ?? fetch)(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [input.to],
        subject: "비밀번호를 재설정해 주세요",
        text: `비밀번호를 재설정하려면 다음 링크를 여세요: ${url}`,
        html: `<p>비밀번호를 재설정하려면 아래 링크를 여세요.</p><p><a href="${escapeHtml(url)}">비밀번호 재설정</a></p>`
      })
    });
    if (!response.ok) return "unavailable";
    return "sent";
  } catch {
    return "unavailable";
  }
};
