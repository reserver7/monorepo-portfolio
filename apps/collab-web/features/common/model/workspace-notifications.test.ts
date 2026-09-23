import assert from "node:assert/strict";
import type { WorkspaceNotification } from "@repo/utils/collab";

// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { getWorkspaceNotificationLabel, getWorkspaceNotificationPath } from "./workspace-notifications.ts";

const notification: WorkspaceNotification = {
  id: "notification-1",
  recipientId: "account-1",
  at: "2026-09-23T12:00:00.000Z",
  action: "mentioned",
  entityKind: "document",
  entityId: "doc-1",
  title: "Roadmap",
  memberEmail: "member@example.com",
  commentId: "comment-1"
};

assert.equal(getWorkspaceNotificationLabel(notification), "댓글에서 언급되었습니다.");
assert.equal(getWorkspaceNotificationPath(notification), "/docs/doc-1?comment=comment-1");
assert.equal(
  getWorkspaceNotificationPath({ ...notification, entityKind: "board", commentId: undefined }),
  "/whiteboard/doc-1"
);
console.log("workspace notifications: ok");
