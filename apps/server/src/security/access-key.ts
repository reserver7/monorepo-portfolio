import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "ek1";
const MAX_EDITOR_ACCESS_KEY_LENGTH = 120;
const SALT_BYTES = 16;
const DIGEST_BYTES = 32;

const parseHashPayload = (value: string): { salt: Buffer; digest: Buffer } | null => {
  const parts = value.split("$");
  if (parts.length !== 3) {
    return null;
  }

  const [prefix, saltEncoded, digestEncoded] = parts;
  if (prefix !== HASH_PREFIX || !saltEncoded || !digestEncoded) {
    return null;
  }

  const salt = Buffer.from(saltEncoded, "base64");
  const digest = Buffer.from(digestEncoded, "base64");
  if (salt.length !== SALT_BYTES || digest.length !== DIGEST_BYTES) {
    return null;
  }

  return { salt, digest };
};

const deriveDigest = (value: string, salt: Buffer): Buffer => {
  return scryptSync(value, salt, DIGEST_BYTES) as Buffer;
};

const safeEqualText = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const sanitizeEditorAccessKey = (rawValue: string | undefined): string | undefined => {
  const normalized = rawValue?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, MAX_EDITOR_ACCESS_KEY_LENGTH);
};

export const isEditorAccessKeyHash = (value: string | undefined): boolean => {
  const normalized = sanitizeEditorAccessKey(value);
  if (!normalized) {
    return false;
  }

  return parseHashPayload(normalized) !== null;
};

export const hashEditorAccessKey = (rawValue: string): string => {
  const normalized = sanitizeEditorAccessKey(rawValue);
  if (!normalized) {
    return "";
  }

  const salt = randomBytes(SALT_BYTES);
  const digest = deriveDigest(normalized, salt);
  return `${HASH_PREFIX}$${salt.toString("base64")}$${digest.toString("base64")}`;
};

export const createStoredEditorAccessKey = (rawValue: string | undefined): string | undefined => {
  const normalized = sanitizeEditorAccessKey(rawValue);
  if (!normalized) {
    return undefined;
  }

  return hashEditorAccessKey(normalized);
};

export const normalizeStoredEditorAccessKey = (rawValue: string | undefined): string | undefined => {
  const normalized = sanitizeEditorAccessKey(rawValue);
  if (!normalized) {
    return undefined;
  }

  if (isEditorAccessKeyHash(normalized)) {
    return normalized;
  }

  return hashEditorAccessKey(normalized);
};

export const verifyEditorAccessKey = (
  storedValue: string | undefined,
  providedValue: string | undefined
): boolean => {
  const normalizedStored = sanitizeEditorAccessKey(storedValue);
  if (!normalizedStored) {
    return true;
  }

  const normalizedProvided = sanitizeEditorAccessKey(providedValue);
  if (!normalizedProvided) {
    return false;
  }

  const hashPayload = parseHashPayload(normalizedStored);
  if (!hashPayload) {
    return safeEqualText(normalizedProvided, normalizedStored);
  }

  const providedDigest = deriveDigest(normalizedProvided, hashPayload.salt);
  if (providedDigest.length !== hashPayload.digest.length) {
    return false;
  }

  return timingSafeEqual(providedDigest, hashPayload.digest);
};
