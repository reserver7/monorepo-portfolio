import assert from "node:assert/strict";
import test from "node:test";
import {
  createTotpCode,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  verifyTotpCode
} from "./two-factor.js";

test("TOTP codes verify within the clock-skew window and secrets round-trip encrypted", () => {
  const secret = "JBSWY3DPEHPK3PXP";
  const now = 1_700_000_000_000;
  const code = createTotpCode(secret, Math.floor(now / 1000 / 30));

  assert.equal(verifyTotpCode(secret, code, now), true);
  assert.equal(verifyTotpCode(secret, code, now + 30_000), true);
  assert.equal(verifyTotpCode(secret, "000000", now), false);
  assert.equal(decryptTwoFactorSecret(encryptTwoFactorSecret(secret)), secret);
});
