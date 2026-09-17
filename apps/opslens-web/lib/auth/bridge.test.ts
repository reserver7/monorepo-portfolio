import { test } from "node:test";
import assert from "node:assert/strict";
import { createAuthBridgeToken, verifyAuthBridgeToken } from "./bridge";

process.env.OPSLENS_AUTH_BRIDGE_SECRET = "test-bridge-secret-123456";

test("bridge tokens round-trip user identity and reject tampering", () => {
  const token = createAuthBridgeToken(
    { id: "user-1", email: "user@example.com", name: "User", role: "operator" },
    "bridge",
    60
  );
  assert.equal(verifyAuthBridgeToken(token).email, "user@example.com");
  assert.throws(() => verifyAuthBridgeToken(`${token}tampered`));
});
