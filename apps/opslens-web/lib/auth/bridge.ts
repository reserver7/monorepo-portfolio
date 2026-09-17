import { createHmac, timingSafeEqual } from "node:crypto";

type BridgeUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "operator" | "viewer";
};

type BridgePayload = BridgeUser & { type: "bridge" | "session"; exp: number };

const encode = (value: object): string => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = <T>(value: string): T => JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
const sign = (value: string, secret: string): string =>
  createHmac("sha256", secret).update(value).digest("base64url");

export function createAuthBridgeToken(
  user: BridgeUser,
  type: BridgePayload["type"],
  ttlSeconds: number
): string {
  const header = encode({ alg: "HS256", typ: "OPS-BRIDGE" });
  const payload = encode({ ...user, type, exp: Math.floor(Date.now() / 1000) + ttlSeconds });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned, process.env.OPSLENS_AUTH_BRIDGE_SECRET!.trim())}`;
}

export function verifyAuthBridgeToken(token: string): BridgePayload {
  const [header, payload, signature] = token.split(".");
  const secret = process.env.OPSLENS_AUTH_BRIDGE_SECRET?.trim();
  if (!header || !payload || !signature || !secret) throw new Error("Invalid bridge token");
  const expected = sign(`${header}.${payload}`, secret);
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    throw new Error("Invalid bridge token");
  }
  const decoded = decode<BridgePayload>(payload);
  if (decoded.exp <= Math.floor(Date.now() / 1000)) throw new Error("Expired bridge token");
  return decoded;
}
