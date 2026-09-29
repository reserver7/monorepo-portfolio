import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { consumeEmailChangeToken, createEmailChangeToken } from "./email-change.js";

test("email change tokens are one-time and replace older requests", async () => {
  const rows = new Map<string, any>();
  const prisma = {
    emailChangeToken: {
      deleteMany: async () => rows.clear(),
      create: async ({ data }: any) => {
        const row = { id: randomUUID(), ...data };
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

  const firstToken = await createEmailChangeToken(prisma, "user-1", "first@example.com");
  const secondToken = await createEmailChangeToken(prisma, "user-1", "second@example.com");

  assert.equal(await consumeEmailChangeToken(prisma, firstToken), null);
  const consumed = await consumeEmailChangeToken(prisma, secondToken);
  assert.equal(consumed?.newEmail, "second@example.com");
  assert.equal(await consumeEmailChangeToken(prisma, secondToken), null);
});
