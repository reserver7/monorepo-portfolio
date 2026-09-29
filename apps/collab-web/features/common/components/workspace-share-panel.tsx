"use client";

import type { WorkspaceActivity, WorkspaceMember } from "@repo/utils/collab";
import { socketEventName } from "@repo/utils/collab";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { io } from "socket.io-client";
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, Flex, Typography, confirm, toast } from "@repo/ui";
import { API_BASE_URL } from "@/features/docs/documents/api";
import { fetchRealtimeAccountToken } from "@/lib/auth/realtime-token";
import {
  filterWorkspaceActivities,
  filterWorkspaceMembers,
  getWorkspaceMemberStatus,
  type WorkspaceActivityActionFilter,
  type WorkspaceMemberStatus
} from "@/features/common/model/workspace-members";

type WorkspaceSharePanelProps = {
  kind: "documents" | "boards";
  entityId: string;
  workspaceTitle?: string;
  canManage?: boolean;
  onLeave?: () => void;
  onClose?: () => void;
};

type EmailDelivery = {
  sent: boolean;
  reason?: "disabled" | "missing-config" | "monthly-limit" | "provider-error";
};

const activityLabelKeys: Record<WorkspaceActivity["action"], string> = {
  invited: "activityLabels.invited",
  resent: "activityLabels.resent",
  accepted: "activityLabels.accepted",
  declined: "activityLabels.declined",
  "role-changed": "activityLabels.roleChanged",
  removed: "activityLabels.removed",
  left: "activityLabels.left",
  "ownership-transferred": "activityLabels.ownershipTransferred",
  mentioned: "activityLabels.mentioned",
  replied: "activityLabels.replied"
};

const activityLabel = (t: ReturnType<typeof useTranslations>, action: WorkspaceActivity["action"]) => {
  switch (action) {
    case "invited":
      return t("activityLabels.invited");
    case "resent":
      return t("activityLabels.resent");
    case "accepted":
      return t("activityLabels.accepted");
    case "declined":
      return t("activityLabels.declined");
    case "role-changed":
      return t("activityLabels.roleChanged");
    case "removed":
      return t("activityLabels.removed");
    case "left":
      return t("activityLabels.left");
    case "ownership-transferred":
      return t("activityLabels.ownershipTransferred");
    case "mentioned":
      return t("activityLabels.mentioned");
    case "replied":
      return t("activityLabels.replied");
  }
};

export function WorkspaceSharePanel({
  kind,
  entityId,
  workspaceTitle,
  canManage = true,
  onLeave,
  onClose
}: WorkspaceSharePanelProps) {
  const t = useTranslations("collab.workspaceShare");
  const router = useRouter();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [canLeave, setCanLeave] = useState(false);
  const [activities, setActivities] = useState<WorkspaceActivity[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberStatus, setMemberStatus] = useState<WorkspaceMemberStatus | "all">("all");
  const [activityQuery, setActivityQuery] = useState("");
  const [activityAction, setActivityAction] = useState<WorkspaceActivityActionFilter>("all");
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const endpoint = `/api/workspace/${kind}/${entityId}/members`;
  const activityEndpoint = `/api/workspace/${kind}/${entityId}/activity`;
  const visibleMembers = useMemo(
    () => filterWorkspaceMembers(members, memberQuery, memberStatus),
    [members, memberQuery, memberStatus]
  );
  const filteredActivities = useMemo(
    () => filterWorkspaceActivities(activities, activityQuery, activityAction),
    [activities, activityAction, activityQuery]
  );
  const getEmailDeliveryMessage = (delivery: EmailDelivery | undefined, successMessage: string): string => {
    if (delivery?.sent) return successMessage;
    if (delivery?.reason === "disabled") return t("emailDisabled");
    if (delivery?.reason === "monthly-limit") return t("emailLimit");
    if (delivery?.reason === "missing-config") return t("emailMissingConfig");
    return t("emailProviderError");
  };

  const responseMessage = async (response: Response, fallback: string) => {
    try {
      const payload = (await response.json()) as { message?: string };
      return payload.message || fallback;
    } catch {
      return fallback;
    }
  };

  const loadMembers = async () => {
    const [response, activityResponse] = await Promise.all([
      fetch(endpoint, { credentials: "include", cache: "no-store" }),
      fetch(activityEndpoint, { credentials: "include", cache: "no-store" })
    ]);
    if (!response.ok) return response.status === 403;
    const payload = (await response.json()) as { members?: WorkspaceMember[]; canLeave?: boolean };
    setMembers(payload.members ?? []);
    setCanLeave(payload.canLeave === true);
    if (activityResponse.ok) {
      const activityPayload = (await activityResponse.json()) as { activities?: WorkspaceActivity[] };
      setActivities(activityPayload.activities ?? []);
    }
    return true;
  };

  useEffect(() => {
    void loadMembers();
  }, [endpoint, activityEndpoint]);

  useEffect(() => {
    const socket = io(API_BASE_URL, { transports: ["websocket"], reconnection: true });
    const scope = kind === "documents" ? "document" : "board";
    const handleActivityUpdate = (payload: { scope?: string; entityId?: string }) => {
      if (payload.scope === scope && payload.entityId === entityId) void loadMembers();
    };

    socket.on(socketEventName.activityUpdate, handleActivityUpdate);
    void fetchRealtimeAccountToken().then((accountToken) => {
      if (accountToken) {
        socket.emit(socketEventName.activitySubscribe, { scope, entityId, accountToken });
      }
    });
    return () => {
      socket.off(socketEventName.activityUpdate, handleActivityUpdate);
      socket.disconnect();
    };
  }, [entityId, kind]);

  const invite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role })
    });
    if (!response.ok) {
      setMessage(await responseMessage(response, t("inviteFailed")));
      return;
    }
    const payload = (await response.json()) as { emailDelivery?: EmailDelivery; inviteUrl?: string };
    setInviteUrl(payload.inviteUrl ?? null);
    setEmail("");
    setMessage(getEmailDeliveryMessage(payload.emailDelivery, t("inviteSuccess")));
    await loadMembers();
  };

  const remove = async (memberEmail: string) => {
    const member = members.find((candidate) => candidate.email === memberEmail);
    const isInvitation = member?.status === "pending";
    const confirmed = await confirm({
      title: isInvitation ? t("confirmCancelTitle") : t("confirmRemoveTitle"),
      description: isInvitation
        ? t("confirmCancelDescription", { email: memberEmail })
        : t("confirmRemoveDescription", { email: memberEmail }),
      confirmText: isInvitation ? t("cancelInvitation") : t("removeMember"),
      confirmVariant: "danger",
      cancelText: t("back")
    });
    if (!confirmed) return;

    const response = await fetch(`${endpoint}?email=${encodeURIComponent(memberEmail)}`, {
      method: "DELETE",
      credentials: "include"
    });
    if (response.ok) {
      setMembers((current) => current.filter((member) => member.email !== memberEmail));
      const successMessage = member?.status === "pending" ? t("cancelInvitation") : t("removeMember");
      setMessage(successMessage);
      toast.success(successMessage);
    } else {
      setMessage(await responseMessage(response, isInvitation ? t("cancelFailed") : t("removeFailed")));
    }
  };

  const resend = async (member: WorkspaceMember) => {
    const confirmed = await confirm({
      title: t("confirmResendTitle"),
      description: t("confirmResendDescription", { email: member.email }),
      confirmText: t("resend"),
      cancelText: t("cancel")
    });
    if (!confirmed) return;

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: member.email, role: member.role })
    });
    if (!response.ok) {
      setMessage(await responseMessage(response, t("resendFailed")));
      return;
    }
    const payload = (await response.json()) as { emailDelivery?: EmailDelivery; inviteUrl?: string };
    setInviteUrl(payload.inviteUrl ?? null);
    setMessage(getEmailDeliveryMessage(payload.emailDelivery, t("resendSuccess")));
    await loadMembers();
  };

  const copyInvitationLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setMessage(t("copySuccess"));
    } catch {
      setMessage(t("copyError"));
    }
  };

  const updateRole = async (member: WorkspaceMember, nextRole: "viewer" | "editor") => {
    if (member.role === nextRole) return;
    const nextRoleLabel = nextRole === "editor" ? t("editor") : t("viewer");
    const confirmed = await confirm({
      title: t("confirmRoleTitle"),
      description: t("confirmRoleDescription", { email: member.email, role: nextRoleLabel }),
      confirmText: t("confirm"),
      cancelText: t("cancel")
    });
    if (!confirmed) return;

    const response = await fetch(endpoint, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: member.email, role: nextRole })
    });
    if (!response.ok) {
      setMessage(await responseMessage(response, t("roleChangeFailed")));
      return;
    }
    setMessage(t("roleChanged"));
    toast.success(t("roleChanged"));
    await loadMembers();
  };

  const transferOwnership = async (member: WorkspaceMember) => {
    const confirmed = await confirm({
      title: t("confirmTransferTitle"),
      description: t("confirmTransferDescription", { email: member.email }),
      confirmText: t("transferOwnership"),
      confirmVariant: "danger",
      cancelText: t("cancel")
    });
    if (!confirmed) return;

    const response = await fetch(`${endpoint}/transfer-ownership`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: member.email })
    });
    if (!response.ok) {
      setMessage(await responseMessage(response, t("transferFailed")));
      return;
    }
    setMessage(t("ownershipTransferred"));
    toast.success(t("ownershipTransferred"));
    await loadMembers();
  };

  const leave = async () => {
    const confirmed = await confirm({
      title: t("confirmLeaveTitle"),
      description: t("confirmLeaveDescription", { workspace: workspaceTitle || t("title") }),
      confirmText: t("leave"),
      confirmVariant: "danger",
      cancelText: t("cancel")
    });
    if (!confirmed) return;

    setIsLeaving(true);
    const response = await fetch(`${endpoint}/self`, {
      method: "DELETE",
      credentials: "include"
    });
    if (!response.ok) {
      setMessage(t("leaveFailed"));
      setIsLeaving(false);
      return;
    }
    toast.success(t("left"));
    if (onLeave) {
      onLeave();
      setIsLeaving(false);
      return;
    }
    router.replace(kind === "documents" ? "/docs" : "/whiteboard");
  };

  return (
    <section className="border-default bg-surface mb-5 rounded-2xl border p-5 shadow-[var(--shadow-card)]">
      <Flex className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{t("title")}</h2>
          <p className="text-body-sm text-muted mt-1">{t("description")}</p>
        </div>
        {onClose ? (
          <Button type="button" variant="text" size="sm" onClick={onClose} aria-label={t("close")}>
            {t("close")}
          </Button>
        ) : null}
      </Flex>
      {canManage ? (
        <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]" onSubmit={invite}>
          <Input
            label={t("inviteEmail")}
            labelClassName="sr-only"
            id={`${kind}-member-email`}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("emailPlaceholder")}
            className="text-sm"
          />
          <Select
            label={t("role")}
            labelClassName="sr-only"
            value={role}
            options={[
              { value: "viewer", label: t("viewer") },
              { value: "editor", label: t("editor") }
            ]}
            onChange={(value) => setRole(value === "editor" ? "editor" : "viewer")}
            className="text-sm"
          />
          <Button type="submit" size="sm">
            {t("invite")}
          </Button>
        </form>
      ) : (
        <Typography as="p" variant="bodySm" color="muted">
          {t("sharedMemberDescription")}
        </Typography>
      )}
      {message ? <p className="text-body-sm text-muted mt-2">{message}</p> : null}
      {canManage && inviteUrl ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => void copyInvitationLink()}
        >
          {t("copyLink")}
        </Button>
      ) : null}
      {canLeave ? (
        <Button
          variant="text"
          size="sm"
          className="text-danger mt-3 text-xs"
          loading={isLeaving}
          onClick={() => void leave()}
        >
          {t("leave")}
        </Button>
      ) : null}
      {members.length > 0 ? (
        <Flex className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            label={t("memberSearch")}
            labelClassName="sr-only"
            value={memberQuery}
            onChange={(event) => setMemberQuery(event.target.value)}
            placeholder={t("memberEmailPlaceholder")}
            className="text-sm"
          />
          <Select
            label={t("memberStatus")}
            labelClassName="sr-only"
            value={memberStatus}
            options={[
              { value: "all", label: t("allStatuses") },
              { value: "pending", label: t("pending") },
              { value: "accepted", label: t("accepted") },
              { value: "declined", label: t("declined") },
              { value: "expired", label: t("expired") }
            ]}
            onChange={(value) =>
              setMemberStatus(
                typeof value === "string" && ["pending", "accepted", "declined", "expired"].includes(value)
                  ? (value as WorkspaceMemberStatus)
                  : "all"
              )
            }
            className="text-sm sm:w-40"
          />
        </Flex>
      ) : null}
      {members.length > 0 ? (
        <Typography as="p" variant="bodySm" color="muted" className="mt-2">
          {t("memberCount", { visible: visibleMembers.length, total: members.length })}
        </Typography>
      ) : null}
      {members.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {visibleMembers.map((member) => {
            const status = getWorkspaceMemberStatus(member);
            return (
              <li
                className="border-default flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
                key={member.email}
              >
                <span>
                  {member.email} · {member.role === "editor" ? t("editor") : t("viewer")} · {t(status)}
                </span>
                <span className="flex items-center gap-3">
                  {canManage && status === "accepted" ? (
                    <label className="sr-only" htmlFor={`${kind}-member-role-${member.email}`}>
                      {member.email} {t("role")}
                    </label>
                  ) : null}
                  {canManage && status === "accepted" ? (
                    <Select
                      label={`${member.email} ${t("role")}`}
                      labelClassName="sr-only"
                      value={member.role}
                      options={[
                        { value: "viewer", label: t("viewer") },
                        { value: "editor", label: t("editor") }
                      ]}
                      onChange={(value) => void updateRole(member, value === "editor" ? "editor" : "viewer")}
                      className="text-xs"
                    />
                  ) : null}
                  {canManage && (status === "pending" || status === "expired") ? (
                    <Button variant="text" size="sm" className="text-xs" onClick={() => void resend(member)}>
                      {status === "expired" ? t("sendAgain") : t("resend")}
                    </Button>
                  ) : null}
                  {canManage && status === "accepted" ? (
                    <Button
                      variant="text"
                      size="sm"
                      className="text-xs"
                      onClick={() => void transferOwnership(member)}
                    >
                      {t("transferOwnership")}
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button
                      variant="text"
                      size="sm"
                      className="text-danger text-xs"
                      onClick={() => void remove(member.email)}
                    >
                      {status === "pending" || status === "expired" ? t("cancel") : t("removeMember")}
                    </Button>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {activities.length > 0 ? (
        <div className="border-default mt-5 border-t pt-4">
          <Flex className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{t("shareActivity")}</h3>
              <Typography as="p" variant="bodySm" color="muted" className="mt-1">
                {t("activityCount", { visible: filteredActivities.length, total: activities.length })}
              </Typography>
            </div>
            <Button variant="text" size="sm" onClick={() => setShowAllActivities((current) => !current)}>
              {showAllActivities ? t("recentActivities") : t("allActivities")}
            </Button>
          </Flex>
          <Flex className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              label={t("activityMemberSearch")}
              labelClassName="sr-only"
              value={activityQuery}
              onChange={(event) => setActivityQuery(event.target.value)}
              placeholder={t("activityEmailPlaceholder")}
              className="text-sm"
            />
            <Select
              label={t("activityType")}
              labelClassName="sr-only"
              value={activityAction}
              options={[
                { value: "all", label: t("allActivity") },
                { value: "invited", label: t("activityLabels.invited") },
                { value: "resent", label: t("activityLabels.resent") },
                { value: "accepted", label: t("activityLabels.accepted") },
                { value: "declined", label: t("activityLabels.declined") },
                { value: "role-changed", label: t("activityLabels.roleChanged") },
                { value: "removed", label: t("activityLabels.removed") },
                { value: "left", label: t("activityLabels.left") },
                { value: "ownership-transferred", label: t("activityLabels.ownershipTransferred") }
              ]}
              onChange={(value) =>
                setActivityAction(
                  typeof value === "string" && value in activityLabelKeys
                    ? (value as WorkspaceActivityActionFilter)
                    : "all"
                )
              }
              className="text-sm sm:w-40"
            />
          </Flex>
          <ul className="text-body-sm text-muted mt-2 grid gap-1">
            {filteredActivities.slice(0, showAllActivities ? undefined : 10).map((activity) => (
              <li key={activity.id}>
                {activityLabel(t, activity.action)} · {activity.memberEmail} · {activity.actorId} ·{" "}
                {new Date(activity.at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
