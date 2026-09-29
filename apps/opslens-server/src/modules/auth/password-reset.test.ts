import assert from "node:assert/strict";
import test from "node:test";
import { consumePasswordResetToken, createPasswordResetToken } from "./password-reset.js";

test("password reset tokens are one-time and expire", async () => {
  const rows = new Map<string, any>();
  const prisma = {
    passwordResetToken: {
      deleteMany: async () => rows.clear(),
      create: async ({ data }: any) => {
        const row = { id: "reset-1", ...data, user: { email: "user@example.com" } };
        rows.set(data.tokenHash, row);
        return row;
      },
      findUnique: async ({ where }: any) => rows.get(where.tokenHash) ?? null,
      update: async ({ where, data }: any) => {
        const row = [...rows.values()].find((value) => value.id === where.id);
        Object.assign(row, data);
        return row;
      }
    }
  } as never;

  const token = await createPasswordResetToken(prisma, "user-1");
  const consumed = await consumePasswordResetToken(prisma, token);

  assert.equal(consumed?.email, "user@example.com");
  assert.equal(await consumePasswordResetToken(prisma, token), null);
});
