import type { WorkspaceNotification } from "@repo/utils/collab";

export const getPendingInvitations = (notifications: WorkspaceNotification[]): WorkspaceNotification[] => {
  const pending = new Map<string, WorkspaceNotification>();

  for (const notification of notifications) {
    if (notification.action !== "invited" && notification.action !== "resent") {
      continue;
    }

    const key = `${notification.entityKind}:${notification.entityId}`;
    if (!pending.has(key)) {
      pending.set(key, notification);
    }
  }

  return [...pending.values()];
};
