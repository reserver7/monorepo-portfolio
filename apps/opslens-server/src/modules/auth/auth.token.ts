import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { UnauthorizedException } from "@nestjs/common";
import type { AuthRole } from "@prisma/client";

type AccessTokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: AuthRole;
  iat: number;
  exp: number;
};

export type AuthUserPayload = Omit<AccessTokenPayload, "iat" | "exp">;

const TOKEN_HEADER = {
  alg: "HS256",
  typ: "JWT"
} as const;

const PASSWORD_HASH_PREFIX = "scrypt";
const PASSWORD_KEY_LENGTH = 64;

const encodeBase64Url = (value: string): string => Buffer.from(value).toString("base64url");
const decodeBase64Url = (value: string): string => Buffer.from(value, "base64url").toString("utf8");

const sign = (unsignedToken: string, secret: string): string =>
  createHmac("sha256", secret).update(unsignedToken).digest("base64url");

export const signAccessToken = (
  payload: AuthUserPayload,
  secret: string,
  expiresInSeconds: number
): string => {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AccessTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(TOKEN_HEADER));
  const encodedPayload = encodeBase64Url(JSON.stringify(fullPayload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(unsignedToken, secret);

  return `${unsignedToken}.${signature}`;
};

export const verifyAccessToken = (token: string, secret: string): AuthUserPayload => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new UnauthorizedException("인증 토큰 형식이 올바르지 않습니다.");
  }

  const encodedHeader = parts[0] ?? "";
  const encodedPayload = parts[1] ?? "";
  const providedSignature = parts[2] ?? "";
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(unsignedToken, secret);

  const providedBytes = Buffer.from(providedSignature);
  const expectedBytes = Buffer.from(expectedSignature);
  if (providedBytes.length !== expectedBytes.length || !timingSafeEqual(providedBytes, expectedBytes)) {
    throw new UnauthorizedException("인증 토큰 서명이 유효하지 않습니다.");
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as Partial<AccessTokenPayload>;
  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    (payload.role !== "admin" && payload.role !== "operator" && payload.role !== "viewer") ||
    typeof payload.exp !== "number"
  ) {
    throw new UnauthorizedException("인증 토큰 정보가 손상되었습니다.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new UnauthorizedException("세션이 만료되었습니다. 다시 로그인해 주세요.");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role
  };
};

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("base64url");
  const digest = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("base64url");
  return `${PASSWORD_HASH_PREFIX}$${salt}$${digest}`;
};

export const verifyPassword = (password: string, passwordHash: string): boolean => {
  const [prefix, salt, expectedDigest] = passwordHash.split("$");
  if (prefix !== PASSWORD_HASH_PREFIX || !salt || !expectedDigest) {
    return false;
  }

  const digest = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("base64url");
  const digestBytes = Buffer.from(digest);
  const expectedBytes = Buffer.from(expectedDigest);
  if (digestBytes.length !== expectedBytes.length) {
    return false;
  }
  return timingSafeEqual(digestBytes, expectedBytes);
};
