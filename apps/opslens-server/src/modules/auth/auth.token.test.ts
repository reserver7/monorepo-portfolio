import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, signAccessToken, verifyAccessToken, verifyPassword } from "./auth.token.js";

const secret = "test-secret-with-at-least-16-characters";
const user = {
  sub: "user-1",
  email: "operator@example.com",
  name: "Operator",
  role: "operator" as const
};

test("access token round trip preserves the authenticated user", () => {
  const token = signAccessToken(user, secret, 60);

  assert.deepEqual(verifyAccessToken(token, secret), user);
});

test("access token rejects a tampered signature", () => {
  const token = signAccessToken(user, secret, 60);
  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

  assert.throws(() => verifyAccessToken(tampered, secret));
});

test("access token rejects an expired token", () => {
  const token = signAccessToken(user, secret, -1);

  assert.throws(() => verifyAccessToken(token, secret));
});

test("password hashes verify only the original password", () => {
  const hash = hashPassword("correct horse battery staple");

  assert.equal(verifyPassword("correct horse battery staple", hash), true);
  assert.equal(verifyPassword("incorrect password", hash), false);
  assert.equal(verifyPassword("correct horse battery staple", "invalid-hash"), false);
});
