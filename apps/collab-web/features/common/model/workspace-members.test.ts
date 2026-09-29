import assert from "node:assert/strict";
import type { WorkspaceActivity, WorkspaceMember } from "@repo/utils/collab";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Node's strip-types runner requires the explicit extension.
// prettier-ignore
import { filterWorkspaceActivities, filterWorkspaceMembers, getWorkspaceMemberStatus } from "./workspace-members.ts";

const members: WorkspaceMember[] = [
  { email: "pending@example.com", role: "viewer", invitedAt: "2026-09-20T00:00:00.000Z", status: "pending" },
  {
    email: "expired@example.com",
    role: "editor",
    invitedAt: "2026-09-20T00:00:00.000Z",
    status: "pending",
    expiresAt: "2026-09-21T00:00:00.000Z"
  },
  { email: "accepted@example.com", role: "editor", invitedAt: "2026-09-20T00:00:00.000Z", status: "accepted" }
];

assert.equal(getWorkspaceMemberStatus(members[1]!, Date.parse("2026-09-22T00:00:00.000Z")), "expired");
assert.deepEqual(
  filterWorkspaceMembers(members, "ACCEPTED", "all", Date.parse("2026-09-22T00:00:00.000Z")).map(
    (member) => member.email
  ),
  ["accepted@example.com"]
);
assert.deepEqual(
  filterWorkspaceMembers(members, "", "expired", Date.parse("2026-09-22T00:00:00.000Z")).map(
    (member) => member.email
  ),
  ["expired@example.com"]
);
console.log("workspace member filters: ok");

const activities: WorkspaceActivity[] = [
  {
    id: "1",
    at: "2026-09-22T00:00:00.000Z",
    actorId: "owner",
    action: "invited",
    memberEmail: "one@example.com"
  },
  {
    id: "2",
    at: "2026-09-22T00:00:00.000Z",
    actorId: "owner",
    action: "role-changed",
    memberEmail: "two@example.com"
  }
];
assert.deepEqual(filterWorkspaceActivities(activities, "TWO", "all"), [activities[1]]);
assert.deepEqual(filterWorkspaceActivities(activities, "", "invited"), [activities[0]]);
console.log("workspace activity filters: ok");
