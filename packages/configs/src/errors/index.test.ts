import test from "node:test";
import assert from "node:assert/strict";
import { API_ERROR_CODES, createApiErrorPayload, isApiErrorPayload } from "./index";

test("creates a locale-independent API error contract", () => {
  const payload = createApiErrorPayload(API_ERROR_CODES.VALIDATION, { field: "email" });
  assert.deepEqual(payload, { code: "VALIDATION", params: { field: "email" } });
  assert.equal(isApiErrorPayload(payload), true);
  assert.equal(isApiErrorPayload({ message: "입력값이 잘못되었습니다." }), false);
});
