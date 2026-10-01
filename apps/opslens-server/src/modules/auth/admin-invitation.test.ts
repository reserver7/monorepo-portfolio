import assert from "node:assert/strict";
import test from "node:test";
import { createAdminInvitationToken, consumeAdminInvitation } from "./admin-invitation.js";

test("admin invitation tokens are stored hashed and can be consumed once", async () => {
  let stored: Record<string, unknown> | undefined;
  const prisma = {
    adminInvitation: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        stored = { id: "invite-1", ...data };
        return stored;
      },
      findUnique: async () => stored
    }
  } as never;

  const created = await createAdminInvitationToken(prisma, {
    email: "operator@example.com",
    role: "operator",
    invitedBy: "admin@example.com"
  });

  assert.notEqual(created.token, stored?.tokenHash);
  assert.equal((await consumeAdminInvitation(prisma, created.token))?.id, "invite-1");
});
