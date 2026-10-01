import assert from "node:assert/strict";
import test from "node:test";
import { isTwoFactorChallengeError } from "./login-ux";

test("recognizes the server response that asks for a second-factor code", () => {
  assert.equal(isTwoFactorChallengeError("2FA 인증 코드가 필요하거나 올바르지 않습니다."), true);
  assert.equal(isTwoFactorChallengeError("이메일 또는 비밀번호가 올바르지 않습니다."), false);
});
