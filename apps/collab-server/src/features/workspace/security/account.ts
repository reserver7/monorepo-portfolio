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
