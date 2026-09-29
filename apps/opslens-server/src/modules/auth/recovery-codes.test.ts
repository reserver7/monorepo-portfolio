import assert from "node:assert/strict";
import test from "node:test";
import { consumeRecoveryCode, createRecoveryCodes, serializeRecoveryCodes } from "./recovery-codes.js";

test("recovery codes are one-time and stored as hashes", () => {
  const codes = createRecoveryCodes();
  const serialized = serializeRecoveryCodes(codes);
  const remaining = consumeRecoveryCode(serialized, codes[0]!);

  assert.ok(remaining);
  assert.equal(consumeRecoveryCode(remaining, codes[0]!), null);
  assert.equal(consumeRecoveryCode(remaining, codes[1]!) !== null, true);
});
