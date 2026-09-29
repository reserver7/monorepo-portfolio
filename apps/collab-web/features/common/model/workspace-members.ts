import type { WorkspaceActivity, WorkspaceMember } from "@repo/utils/collab";

export type WorkspaceMemberStatus = "pending" | "accepted" | "declined" | "expired";
export type WorkspaceActivityActionFilter = "all" | WorkspaceActivity["action"];

export const getWorkspaceMemberStatus = (
  member: WorkspaceMember,
  now = Date.now()
): WorkspaceMemberStatus => {
  if (member.status === "pending" && member.expiresAt && Date.parse(member.expiresAt) <= now) {
    return "expired";
  }
  return member.status ?? "accepted";
};

export const filterWorkspaceMembers = (
  members: WorkspaceMember[],
  query: string,
  status: WorkspaceMemberStatus | "all",
  now = Date.now()
): WorkspaceMember[] => {
  const normalizedQuery = query.trim().toLowerCase();
  return members.filter((member) => {
    const matchesQuery = !normalizedQuery || member.email.toLowerCase().includes(normalizedQuery);
    const matchesStatus = status === "all" || getWorkspaceMemberStatus(member, now) === status;
    return matchesQuery && matchesStatus;
  });
};

export const filterWorkspaceActivities = (
  activities: WorkspaceActivity[],
  query: string,
  action: WorkspaceActivityActionFilter
): WorkspaceActivity[] => {
  const normalizedQuery = query.trim().toLowerCase();
  return activities.filter(
    (activity) =>
      (!normalizedQuery || activity.memberEmail.toLowerCase().includes(normalizedQuery)) &&
      (action === "all" || activity.action === action)
  );
};
