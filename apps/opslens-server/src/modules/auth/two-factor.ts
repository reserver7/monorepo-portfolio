import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { env } from "../../config/env.js";

const PERIOD_SECONDS = 30;
const DIGITS = 6;

const createHashKey = (secret: string): Buffer => createHmac("sha256", secret).update("opslens-2fa").digest();

const base32Encode = (bytes: Buffer): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let result = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += alphabet[(value << (5 - bits)) & 31];
  return result;
};

const base32Decode = (value: string): Buffer => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let current = 0;
  const output: number[] = [];
  for (const character of value.replaceAll("=", "").toUpperCase()) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("Invalid base32 secret");
    current = (current << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((current >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
};

export const encryptTwoFactorSecret = (secret: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createHashKey(env.AUTH_JWT_SECRET), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url")
  ].join(".");
};

export const decryptTwoFactorSecret = (value: string): string => {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("Invalid encrypted secret");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    createHashKey(env.AUTH_JWT_SECRET),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final()
  ]).toString("utf8");
};

export const createTwoFactorSecret = (): string => base32Encode(randomBytes(20));

export const createTwoFactorUri = (secret: string, email: string): string =>
  `otpauth://totp/OpsLens:${encodeURIComponent(email)}?secret=${secret}&issuer=OpsLens&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD_SECONDS}`;

export const createTotpCode = (secret: string, counter: number): string => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", base32Decode(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1]! & 15;
  const binary =
    ((digest[offset]! & 127) << 24) |
    ((digest[offset + 1]! & 255) << 16) |
    ((digest[offset + 2]! & 255) << 8) |
    (digest[offset + 3]! & 255);
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
};

export const verifyTotpCode = (secret: string, code: string, now = Date.now()): boolean => {
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(now / 1000 / PERIOD_SECONDS);
  return [-1, 0, 1].some((offset) => createTotpCode(secret, counter + offset) === code);
};
