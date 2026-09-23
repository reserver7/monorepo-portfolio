import type { WorkspaceNotification } from "@repo/utils/collab";

const labels: Record<WorkspaceNotification["action"], string> = {
  accepted: "초대를 수락했습니다.",
  declined: "초대를 거절했습니다.",
  "role-changed": "권한이 변경되었습니다.",
  removed: "작업 공간에서 제거되었습니다.",
  left: "멤버가 작업 공간을 나갔습니다.",
  "ownership-transferred": "소유권이 변경되었습니다.",
  mentioned: "댓글에서 언급되었습니다.",
  replied: "댓글에 답글이 달렸습니다.",
  invited: "작업 공간에 초대되었습니다.",
  resent: "초대가 다시 전송되었습니다."
};

export const getWorkspaceNotificationLabel = (notification: WorkspaceNotification): string =>
  labels[notification.action];

export const getWorkspaceNotificationPath = (notification: WorkspaceNotification): string =>
  notification.entityKind === "document"
    ? `/docs/${notification.entityId}${notification.commentId ? `?comment=${encodeURIComponent(notification.commentId)}` : ""}`
    : `/whiteboard/${notification.entityId}`;

export const markWorkspaceNotificationRead = async (notificationId: string): Promise<boolean> => {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    credentials: "include"
  });
  return response.ok;
};
