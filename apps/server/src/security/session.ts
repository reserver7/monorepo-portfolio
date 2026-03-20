import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = "v1";
const DEFAULT_SESSION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

interface SessionTokenClaims {
  sid: string;
  iat: number;
  exp: number;
}

const toBase64Url = (value: string): string => {
  return Buffer.from(value, "utf8").toString("base64url");
};

const fromBase64Url = (value: string): string => {
  return Buffer.from(value, "base64url").toString("utf8");
};

const sign = (secret: string, payload: string): string => {
  return createHmac("sha256", secret).update(payload).digest("base64url");
};

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const issueSessionToken = (
  sessionId: string,
  secret: string,
  nowMs = Date.now(),
  ttlMs = DEFAULT_SESSION_TOKEN_TTL_MS
): string => {
  const claims: SessionTokenClaims = {
    sid: sessionId,
    iat: nowMs,
    exp: nowMs + Math.max(1, ttlMs)
  };

  const payload = `${TOKEN_VERSION}.${toBase64Url(JSON.stringify(claims))}`;
  const signature = sign(secret, payload);
  return `${payload}.${signature}`;
};

export const verifySessionToken = (
  token: string | undefined,
  secret: string,
  nowMs = Date.now()
): { valid: boolean; sessionId?: string } => {
  if (!token) {
    return { valid: false };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false };
  }

  const [version, encodedClaims, signature] = parts;
  if (version !== TOKEN_VERSION || !encodedClaims || !signature) {
    return { valid: false };
  }

  const payload = `${version}.${encodedClaims}`;
  const expectedSignature = sign(secret, payload);
  if (!safeEqual(expectedSignature, signature)) {
    return { valid: false };
  }

  try {
    const rawClaims = fromBase64Url(encodedClaims);
    const claims = JSON.parse(rawClaims) as SessionTokenClaims;
    if (
      !claims ||
      typeof claims.sid !== "string" ||
      claims.sid.trim().length === 0 ||
      typeof claims.exp !== "number" ||
      claims.exp < nowMs
    ) {
      return { valid: false };
    }

    return {
      valid: true,
      sessionId: claims.sid
    };
  } catch {
    return { valid: false };
  }
};
