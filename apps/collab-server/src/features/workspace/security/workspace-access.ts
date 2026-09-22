import type { AccountIdentity } from "./account";
import type { AccessRole, WorkspaceMember } from "../../../../../../packages/utils/src/collab/server";

export type WorkspacePermission = "owner" | AccessRole | "denied" | "legacy";

interface WorkspaceAccessRecord {
  ownerId?: string;
  members?: WorkspaceMember[];
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const resolveWorkspacePermission = (
  record: WorkspaceAccessRecord,
  account: AccountIdentity | null | undefined
): WorkspacePermission => {
  if (!record.ownerId) return "legacy";
  if (!account) return "denied";
  if (record.ownerId === account.id) return "owner";

  const member = (record.members ?? []).find(
    (candidate) =>
      candidate.status !== "pending" &&
      candidate.status !== "declined" &&
      !(candidate.expiresAt && Date.parse(candidate.expiresAt) <= Date.now()) &&
      ((candidate.accountId && candidate.accountId === account.id) ||
        normalizeEmail(candidate.email) === normalizeEmail(account.email))
  );
  return member?.role ?? "denied";
};

export const canReadWorkspace = (permission: WorkspacePermission): boolean => permission !== "denied";

export const canEditWorkspace = (permission: WorkspacePermission): boolean =>
  permission === "owner" || permission === "editor";

export const canManageWorkspace = (permission: WorkspacePermission): boolean => permission === "owner";

export const normalizeWorkspaceMemberEmail = normalizeEmail;
