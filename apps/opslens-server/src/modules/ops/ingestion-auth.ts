import { timingSafeEqual } from "node:crypto";

export function verifyIngestionKey(provided: string | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}
