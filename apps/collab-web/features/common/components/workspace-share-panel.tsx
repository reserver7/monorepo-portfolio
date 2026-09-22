"use client";

import type { WorkspaceMember } from "@repo/utils/collab";
import { useEffect, useState } from "react";

type WorkspaceSharePanelProps = {
  kind: "documents" | "boards";
  entityId: string;
};

export function WorkspaceSharePanel({ kind, entityId }: WorkspaceSharePanelProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [message, setMessage] = useState("");
  const endpoint = `/api/workspace/${kind}/${entityId}/members`;

  const loadMembers = async () => {
    const response = await fetch(endpoint, { credentials: "include", cache: "no-store" });
    if (!response.ok) return response.status === 403;
    const payload = (await response.json()) as { members?: WorkspaceMember[] };
    setMembers(payload.members ?? []);
    return true;
  };

  useEffect(() => {
    void loadMembers();
  }, [endpoint]);

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
    }
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
      {members.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {members.map((member) => (
            <li
              className="border-default flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
              key={member.email}
            >
              <span>
                {member.email} · {member.role === "editor" ? "편집" : "보기"}
              </span>
              <button className="text-danger text-xs" type="button" onClick={() => void remove(member.email)}>
                제거
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
