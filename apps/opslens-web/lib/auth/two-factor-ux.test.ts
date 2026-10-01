import test from "node:test";
import assert from "node:assert/strict";
import { formatRecoveryCodes } from "./two-factor-ux";

test("formats recovery codes one per line for safe copy and download", () => {
  assert.equal(formatRecoveryCodes(["alpha", "beta"]), "alpha\nbeta");
});
