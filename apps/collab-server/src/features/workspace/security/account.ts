import { createHmac, timingSafeEqual } from "node:crypto";

export interface AccountIdentity {
  id: string;
  email: string;
  name: string;
  role: "admin" | "operator" | "viewer";
}

interface AccountToken extends AccountIdentity {
  type: "session";
  exp: number;
}

interface RealtimeAccountToken extends AccountIdentity {
  type: "realtime";
  exp: number;
}

const decode = <T>(value: string): T => JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;

export const extractAccountFromAuthorization = (
  authorization: string | undefined,
  secret: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000)
): AccountIdentity | null => {
  if (!authorization?.startsWith("Bearer ") || !secret) return null;

  try {
    const [header, payload, signature] = authorization.slice(7).trim().split(".");
    if (!header || !payload || !signature) return null;
    const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
    if (
      expected.length !== signature.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    ) {
      return null;
    }

    const token = decode<AccountToken>(payload);
    if (
      token.type !== "session" ||
      !token.id ||
      !token.email ||
      !token.name ||
      !token.exp ||
      token.exp <= nowSeconds
    ) {
      return null;
    }

    return { id: token.id, email: token.email, name: token.name, role: token.role };
  } catch {
    return null;
  }
};

export const issueAccountRealtimeToken = (
  account: AccountIdentity,
  secret: string,
  nowMs = Date.now(),
  ttlMs = 5 * 60 * 1000
): string => {
  const payload = Buffer.from(
    JSON.stringify({ ...account, type: "realtime", exp: Math.floor((nowMs + ttlMs) / 1000) }),
    "utf8"
  ).toString("base64url");
  const unsigned = `rt1.${payload}`;
  return `${unsigned}.${createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
};

export const extractAccountFromRealtimeToken = (
  value: string | undefined,
  secret: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000)
): AccountIdentity | null => {
  if (!value || !secret) return null;
  try {
    const [version, payload, signature] = value.split(".");
    if (version !== "rt1" || !payload || !signature) return null;
    const unsigned = `${version}.${payload}`;
    const expected = createHmac("sha256", secret).update(unsigned).digest("base64url");
    if (
      expected.length !== signature.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    ) {
      return null;
    }
    const token = decode<RealtimeAccountToken>(payload);
    if (
      token.type !== "realtime" ||
      !token.id ||
      !token.email ||
      !token.name ||
      !token.exp ||
      token.exp <= nowSeconds
    ) {
      return null;
    }
    return { id: token.id, email: token.email, name: token.name, role: token.role };
  } catch {
    return null;
  }
};
