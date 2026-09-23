"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Flex } from "@repo/ui";
import { buildInvitationLoginPath } from "@/lib/auth/invitation-next";

type Invitation = {
  kind: "document" | "board";
  id: string;
  title: string;
  role: "viewer" | "editor";
};

export default function InvitationPage() {
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [message, setMessage] = useState("초대 정보를 확인하고 있습니다.");
  const [loginPath, setLoginPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kind = params.get("kind");
    const id = params.get("id");
    const role = params.get("role");
    if ((kind !== "document" && kind !== "board") || !id || (role !== "viewer" && role !== "editor")) {
      setMessage("유효하지 않은 초대 링크입니다.");
      return;
    }
    setInvitation({ kind, id, role, title: params.get("title") || "작업 공간" });
  }, []);

  const respond = async (status: "accepted" | "declined") => {
    if (!invitation) return;
    setBusy(true);
    const resource = invitation.kind === "document" ? "documents" : "boards";
    const response = await fetch(`/api/workspace/${resource}/${invitation.id}/members/respond`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      setMessage(
        response.status === 401
          ? "로그인 후 초대를 처리할 수 있습니다."
          : "초대가 만료되었거나 이 계정의 초대가 아닙니다."
      );
      if (response.status === 401) setLoginPath(buildInvitationLoginPath(window.location.search));
      setBusy(false);
      return;
    }
    if (status === "declined") {
      setMessage("초대를 거절했습니다.");
      setBusy(false);
      return;
    }
    router.replace(
      invitation.kind === "document" ? `/docs/${invitation.id}` : `/whiteboard/${invitation.id}`
    );
  };

  return (
    <main className="bg-canvas flex min-h-screen items-center justify-center p-6">
      <section className="border-default bg-surface w-full max-w-md rounded-2xl border p-6 shadow-[var(--shadow-card)]">
        <p className="text-body-sm text-muted">Collab 초대</p>
        <h1 className="mt-2 text-2xl font-semibold">{invitation?.title ?? "작업 공간"}</h1>
        {invitation ? (
          <>
            <p className="text-body-sm text-muted mt-3">
              {invitation.role === "editor" ? "편집" : "보기"} 권한으로 초대되었습니다. 초대를
              수락하시겠습니까?
            </p>
            <Flex className="mt-6 flex gap-2">
              <Button disabled={busy} onClick={() => void respond("accepted")}>
                수락
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => void respond("declined")}>
                거절
              </Button>
            </Flex>
          </>
        ) : null}
        <p className="text-body-sm text-muted mt-4">{message}</p>
        {loginPath ? (
          <Button asChild variant="link" size="sm" className="mt-3 px-0">
            <a href={loginPath}>로그인 후 초대 계속하기</a>
          </Button>
        ) : null}
      </section>
    </main>
  );
}
