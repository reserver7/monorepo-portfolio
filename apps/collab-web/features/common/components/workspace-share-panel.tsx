"use client";

import type { WorkspaceActivity, WorkspaceMember } from "@repo/utils/collab";
import { socketEventName } from "@repo/utils/collab";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/features/docs/documents/api";
import { fetchRealtimeAccountToken } from "@/lib/auth/realtime-token";

type WorkspaceSharePanelProps = {
  kind: "documents" | "boards";
  entityId: string;
};

const activityLabels: Record<WorkspaceActivity["action"], string> = {
  invited: "초대",
  resent: "초대 재전송",
  accepted: "초대 수락",
  declined: "초대 거절",
  "role-changed": "권한 변경",
  removed: "멤버 제거",
  left: "멤버 탈퇴",
  "ownership-transferred": "소유권 이전",
  mentioned: "댓글 언급",
  replied: "댓글 답글"
};

export function WorkspaceSharePanel({ kind, entityId }: WorkspaceSharePanelProps) {
  const router = useRouter();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [canLeave, setCanLeave] = useState(false);
  const [activities, setActivities] = useState<WorkspaceActivity[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [message, setMessage] = useState("");
  const endpoint = `/api/workspace/${kind}/${entityId}/members`;
  const activityEndpoint = `/api/workspace/${kind}/${entityId}/activity`;

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
      setMessage("멤버를 추가할 권한이 없습니다.");
      return;
    }
    setEmail("");
    setMessage("멤버를 추가했습니다.");
    await loadMembers();
  };

  const remove = async (memberEmail: string) => {
    const response = await fetch(`${endpoint}?email=${encodeURIComponent(memberEmail)}`, {
      method: "DELETE",
      credentials: "include"
    });
    if (response.ok) {
      setMembers((current) => current.filter((member) => member.email !== memberEmail));
      setMessage("초대를 취소했습니다.");
    }
  };

  const resend = async (member: WorkspaceMember) => {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: member.email, role: member.role })
    });
    setMessage(response.ok ? "초대 이메일을 다시 보냈습니다." : "초대 이메일을 다시 보내지 못했습니다.");
    if (response.ok) await loadMembers();
  };

  const updateRole = async (member: WorkspaceMember, nextRole: "viewer" | "editor") => {
    const response = await fetch(endpoint, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: member.email, role: nextRole })
    });
    setMessage(response.ok ? "멤버 권한을 변경했습니다." : "멤버 권한을 변경하지 못했습니다.");
    if (response.ok) await loadMembers();
  };

  const transferOwnership = async (member: WorkspaceMember) => {
    if (!window.confirm(`${member.email}님에게 소유권을 이전할까요?`)) return;
    const response = await fetch(`${endpoint}/transfer-ownership`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: member.email })
    });
    setMessage(response.ok ? "소유권을 이전했습니다." : "소유권을 이전하지 못했습니다.");
    if (response.ok) await loadMembers();
  };

  const leave = async () => {
    const response = await fetch(`${endpoint}/self`, {
      method: "DELETE",
      credentials: "include"
    });
    if (!response.ok) {
      setMessage("작업 공간에서 나가지 못했습니다.");
      return;
    }
    router.replace(kind === "documents" ? "/docs" : "/whiteboard");
  };

  return (
    <section className="border-default bg-surface mb-5 rounded-2xl border p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3">
        <h2 className="text-base font-semibold">공유 및 권한</h2>
        <p className="text-body-sm text-muted mt-1">초대된 계정만 이 작업 공간에 접근할 수 있습니다.</p>
      </div>
      <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]" onSubmit={invite}>
        <label className="sr-only" htmlFor={`${kind}-member-email`}>
          초대 이메일
        </label>
        <input
          id={`${kind}-member-email`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="이메일 주소"
          className="border-default bg-surface rounded-xl border px-3 py-2 text-sm"
        />
        <label className="sr-only" htmlFor={`${kind}-member-role`}>
          권한
        </label>
        <select
          id={`${kind}-member-role`}
          value={role}
          onChange={(event) => setRole(event.target.value === "editor" ? "editor" : "viewer")}
          className="border-default bg-surface rounded-xl border px-3 py-2 text-sm"
        >
          <option value="viewer">보기</option>
          <option value="editor">편집</option>
        </select>
        <button
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium"
          type="submit"
        >
          초대
        </button>
      </form>
      {message ? <p className="text-body-sm text-muted mt-2">{message}</p> : null}
      {canLeave ? (
        <button className="text-danger mt-3 text-xs" type="button" onClick={() => void leave()}>
          이 작업 공간에서 나가기
        </button>
      ) : null}
      {members.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {members.map((member) => (
            <li
              className="border-default flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
              key={member.email}
            >
              <span>
                {member.email} · {member.role === "editor" ? "편집" : "보기"} ·{" "}
                {member.status === "pending"
                  ? member.expiresAt && new Date(member.expiresAt).getTime() <= Date.now()
                    ? "만료됨"
                    : "대기 중"
                  : member.status === "declined"
                    ? "거절됨"
                    : "승인됨"}
              </span>
              <span className="flex items-center gap-3">
                {member.status !== "pending" && member.status !== "declined" ? (
                  <label className="sr-only" htmlFor={`${kind}-member-role-${member.email}`}>
                    {member.email} 권한
                  </label>
                ) : null}
                {member.status !== "pending" && member.status !== "declined" ? (
                  <select
                    id={`${kind}-member-role-${member.email}`}
                    aria-label={`${member.email} 권한`}
                    className="border-default bg-surface rounded-lg border px-2 py-1 text-xs"
                    value={member.role}
                    onChange={(event) =>
                      void updateRole(member, event.target.value === "editor" ? "editor" : "viewer")
                    }
                  >
                    <option value="viewer">보기</option>
                    <option value="editor">편집</option>
                  </select>
                ) : null}
                {member.status === "pending" ? (
                  <button className="text-primary text-xs" type="button" onClick={() => void resend(member)}>
                    재전송
                  </button>
                ) : null}
                {member.status !== "pending" && member.status !== "declined" ? (
                  <button
                    className="text-primary text-xs"
                    type="button"
                    onClick={() => void transferOwnership(member)}
                  >
                    소유권 이전
                  </button>
                ) : null}
                <button
                  className="text-danger text-xs"
                  type="button"
                  onClick={() => void remove(member.email)}
                >
                  {member.status === "pending" ? "취소" : "제거"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {activities.length > 0 ? (
        <div className="border-default mt-5 border-t pt-4">
          <h3 className="text-sm font-semibold">최근 활동</h3>
          <ul className="text-body-sm text-muted mt-2 grid gap-1">
            {activities.slice(0, 10).map((activity) => (
              <li key={activity.id}>
                {activityLabels[activity.action]} · {activity.memberEmail} · {activity.actorId} ·{" "}
                {new Date(activity.at).toLocaleString("ko-KR")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
