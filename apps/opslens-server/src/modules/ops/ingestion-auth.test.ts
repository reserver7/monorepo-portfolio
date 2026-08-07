import assert from "node:assert/strict";
import test from "node:test";
import { verifyIngestionKey } from "./ingestion-auth.js";

test("accepts only the exact ingestion key", () => {
  assert.equal(verifyIngestionKey("shared-secret", "shared-secret"), true);
  assert.equal(verifyIngestionKey("shared-secrex", "shared-secret"), false);
  assert.equal(verifyIngestionKey(undefined, "shared-secret"), false);
  assert.equal(verifyIngestionKey("shared-secret", undefined), false);
});
