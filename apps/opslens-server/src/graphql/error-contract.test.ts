import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { resolveApiErrorContract } from "./error-contract.js";

const API_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL: "INTERNAL"
} as const;

test("maps HTTP exceptions to locale-independent API codes", () => {
  assert.deepEqual(resolveApiErrorContract({ originalError: new BadRequestException() }), {
    code: API_ERROR_CODES.VALIDATION
  });
  assert.deepEqual(resolveApiErrorContract({ originalError: new NotFoundException() }), {
    code: API_ERROR_CODES.NOT_FOUND
  });
});

test("uses INTERNAL for unknown GraphQL errors", () => {
  assert.deepEqual(resolveApiErrorContract({ extensions: { code: "SOMETHING_ELSE" } }), {
    code: API_ERROR_CODES.INTERNAL
  });
});
