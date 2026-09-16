import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "@repo/react-query/http";
import { resolveLocalizedError } from "./errors";

const translate = Object.assign(
  (key: string, values?: Record<string, string | number>) => `${key}:${values?.field ?? ""}`,
  { has: (key: string) => key !== "api.MISSING" }
);

test("resolves known API codes through the current locale translator", () => {
  assert.equal(
    resolveLocalizedError(
      new ApiError({ code: "VALIDATION", params: { field: "email" } }),
      translate as never,
      "fallback"
    ),
    "api.VALIDATION:email"
  );
});

test("falls back for unknown API codes", () => {
  assert.equal(
    resolveLocalizedError(new ApiError({ code: "NEW_CODE" }), translate as never, "fallback"),
    "fallback"
  );
});
