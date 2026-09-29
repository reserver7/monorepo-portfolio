import { createHash, randomBytes } from "node:crypto";

const RECOVERY_CODE_COUNT = 10;

export const createRecoveryCodes = (): string[] =>
  Array.from({ length: RECOVERY_CODE_COUNT }, () => randomBytes(5).toString("hex").toUpperCase());

export const hashRecoveryCode = (code: string): string =>
  createHash("sha256").update(code.trim().toUpperCase()).digest("hex");

export const serializeRecoveryCodes = (codes: string[]): string =>
  JSON.stringify(codes.map(hashRecoveryCode));

export const consumeRecoveryCode = (serialized: string | null, code: string): string | null => {
  if (!serialized) return null;
  let stored: string[];
  try {
    stored = JSON.parse(serialized) as string[];
  } catch {
    return null;
  }
  const index = stored.indexOf(hashRecoveryCode(code));
  if (index < 0) return null;
  stored.splice(index, 1);
  return JSON.stringify(stored);
};
