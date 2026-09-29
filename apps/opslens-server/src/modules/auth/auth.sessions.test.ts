import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { AuthService } from "./auth.service.js";

test("session listing is scoped to the user and marks the current token without exposing its hash", async () => {
  const refreshToken = "current-refresh-token";
  const tokenHash = createHash("sha256").update(refreshToken).digest("base64url");
  const prisma = {
    refreshToken: {
      findMany: async () => [
        {
          id: "session-1",
          tokenHash,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          lastUsedAt: null,
          expiresAt: new Date("2026-02-01T00:00:00.000Z"),
          ipAddress: "127.0.0.1",
          userAgent: "Test browser"
        }
      ]
    }
  } as never;

  const sessions = await new AuthService(prisma).listSessions(
    { sub: "user-1", email: "user@example.com", name: "User", role: "operator" },
    refreshToken
  );

  assert.equal(sessions[0]?.isCurrent, true);
  assert.equal("tokenHash" in (sessions[0] ?? {}), false);
});
