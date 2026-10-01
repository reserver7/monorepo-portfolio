import { createHash, randomBytes } from "node:crypto";
import type { PrismaService } from "../../integration/db/prisma.service.js";
import { env } from "../../config/env.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// ponytail: process-local free-tier cap; use a durable shared counter when the API runs on multiple instances.
let usage = { month: new Date().toISOString().slice(0, 7), count: 0 };

export type EmailVerificationDelivery =
  | { sent: true }
  | {
      sent: false;
      reason: "disabled" | "missing-config" | "monthly-limit" | "provider-error" | "already-verified";
    };

export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const safeReturnTo = (value: string | undefined): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
};

export const reserveResendEmailSlot = (): boolean => {
  const month = new Date().toISOString().slice(0, 7);
  if (usage.month !== month) usage = { month, count: 0 };
  if (usage.count >= env.RESEND_MONTHLY_LIMIT) return false;
  usage.count += 1;
  return true;
};

export const createEmailVerificationToken = async (
  prisma: PrismaService,
  userId: string,
  returnTo?: string
): Promise<string> => {
  const token = randomBytes(32).toString("base64url");
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      returnTo: safeReturnTo(returnTo),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS)
    }
  });
  return token;
};

export const consumeEmailVerificationToken = async (prisma: PrismaService, token: string) => {
  const stored = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });
  if (!stored || stored.usedAt || stored.expiresAt <= new Date()) return null;

  const now = new Date();
  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: stored.id }, data: { usedAt: now } }),
    prisma.user.update({ where: { id: stored.userId }, data: { emailVerifiedAt: now } })
  ]);
  return { userId: stored.userId, email: stored.user.email, returnTo: stored.returnTo };
};

export const sendEmailVerificationEmail = async (input: {
  to: string;
  token: string;
  fetcher?: typeof fetch;
}): Promise<EmailVerificationDelivery> => {
  if (!env.RESEND_ENABLED) return { sent: false, reason: "disabled" };
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return { sent: false, reason: "missing-config" };

  if (!reserveResendEmailSlot()) return { sent: false, reason: "monthly-limit" };

  const url = `${env.OPSLENS_WEB_URL}/verify-email?token=${encodeURIComponent(input.token)}`;
  try {
    const response = await (input.fetcher ?? fetch)(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [input.to],
        subject: "이메일 주소를 인증해 주세요",
        text: `이메일 인증을 완료하려면 다음 링크를 여세요: ${url}`,
        html: `<p>이메일 인증을 완료하려면 아래 링크를 여세요.</p><p><a href="${escapeHtml(url)}">이메일 인증 완료</a></p>`
      })
    });
    if (!response.ok) return { sent: false, reason: "provider-error" };
    return { sent: true };
  } catch {
    usage.count -= 1;
    return { sent: false, reason: "provider-error" };
  }
};
