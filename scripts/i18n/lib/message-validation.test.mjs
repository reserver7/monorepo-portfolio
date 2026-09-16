import test from "node:test";
import assert from "node:assert/strict";
import { comparePlaceholders, extractPlaceholders } from "./message-validation.mjs";

test("extracts ICU variable names from a message", () => {
  assert.deepEqual(extractPlaceholders("{name} has {count, plural, other {# items}}"), ["count", "name"]);
});

test("reports placeholder drift between locales", () => {
  assert.deepEqual(comparePlaceholders("Welcome, {name}", "환영합니다, {user}"), {
    missing: ["name"],
    extra: ["user"]
  });
});
