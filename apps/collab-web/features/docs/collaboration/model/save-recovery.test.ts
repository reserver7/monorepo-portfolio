import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { shouldOfferSaveRetry } from "./save-recovery.ts";

assert.equal(shouldOfferSaveRetry("editor", "offline"), true);
assert.equal(shouldOfferSaveRetry("viewer", "offline"), false);
assert.equal(shouldOfferSaveRetry("editor", "online"), false);
console.log("save recovery: ok");
