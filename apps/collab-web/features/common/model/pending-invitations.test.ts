import assert from "node:assert/strict";
import type { WorkspaceNotification } from "@repo/utils/collab";

// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { getPendingInvitations } from "./pending-invitations.ts";

const notifications: WorkspaceNotification[] = [
  {
    id: "resent-document",
    recipientId: "account-1",
    at: "2026-09-23T12:00:00.000Z",
    action: "resent",
    entityKind: "document",
    entityId: "doc-1",
    title: "Roadmap",
    memberEmail: "member@example.com"
  },
  {
    id: "invited-document",
    recipientId: "account-1",
    at: "2026-09-23T11:00:00.000Z",
    action: "invited",
    entityKind: "document",
    entityId: "doc-1",
    title: "Roadmap",
    memberEmail: "member@example.com"
  },
  {
    id: "accepted-board",
    recipientId: "account-1",
    at: "2026-09-23T10:00:00.000Z",
    action: "accepted",
    entityKind: "board",
    entityId: "board-1",
    title: "Planning",
    memberEmail: "member@example.com"
  }
];

assert.deepEqual(getPendingInvitations(notifications), [notifications[0]]);
console.log("pending invitations: ok");
