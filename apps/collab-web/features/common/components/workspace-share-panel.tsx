"use client";

import type { WorkspaceActivity, WorkspaceMember } from "@repo/utils/collab";
import { socketEventName } from "@repo/utils/collab";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { Button, Input, Select, Flex } from "@repo/ui";
import { API_BASE_URL } from "@/features/docs/documents/api";
import { fetchRealtimeAccountToken } from "@/lib/auth/realtime-token";

type WorkspaceSharePanelProps = {
  kind: "documents" | "boards";
  entityId: string;
  onClose?: () => void;
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

export function WorkspaceSharePanel({ kind, entityId, onClose }: WorkspaceSharePanelProps) {
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
      <Flex className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">공유 및 권한</h2>
          <p className="text-body-sm text-muted mt-1">초대된 계정만 이 작업 공간에 접근할 수 있습니다.</p>
        </div>
        {onClose ? (
          <Button type="button" variant="text" size="sm" onClick={onClose} aria-label="공유 관리 닫기">
            닫기
          </Button>
        ) : null}
      </Flex>
      <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]" onSubmit={invite}>
        <Input
          label="초대 이메일"
          labelClassName="sr-only"
          id={`${kind}-member-email`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="이메일 주소"
          className="text-sm"
        />
        <Select
          label="권한"
          labelClassName="sr-only"
          value={role}
          options={[
            { value: "viewer", label: "보기" },
            { value: "editor", label: "편집" }
          ]}
          onChange={(value) => setRole(value === "editor" ? "editor" : "viewer")}
          className="text-sm"
        />
        <Button type="submit" size="sm">
          초대
        </Button>
      </form>
      {message ? <p className="text-body-sm text-muted mt-2">{message}</p> : null}
      {canLeave ? (
        <Button variant="text" size="sm" className="text-danger mt-3 text-xs" onClick={() => void leave()}>
          이 작업 공간에서 나가기
        </Button>
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
                  <Select
                    label={`${member.email} 권한`}
                    labelClassName="sr-only"
                    value={member.role}
                    options={[
                      { value: "viewer", label: "보기" },
                      { value: "editor", label: "편집" }
                    ]}
                    onChange={(value) => void updateRole(member, value === "editor" ? "editor" : "viewer")}
                    className="text-xs"
                  />
                ) : null}
                {member.status === "pending" ? (
                  <Button variant="text" size="sm" className="text-xs" onClick={() => void resend(member)}>
                    재전송
                  </Button>
                ) : null}
                {member.status !== "pending" && member.status !== "declined" ? (
                  <Button
                    variant="text"
                    size="sm"
                    className="text-xs"
                    onClick={() => void transferOwnership(member)}
                  >
                    소유권 이전
                  </Button>
                ) : null}
                <Button
                  variant="text"
                  size="sm"
                  className="text-danger text-xs"
                  onClick={() => void remove(member.email)}
                >
                  {member.status === "pending" ? "취소" : "제거"}
                </Button>
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
