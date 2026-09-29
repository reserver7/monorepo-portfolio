"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("collab.invitationPage");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [message, setMessage] = useState(t("checking"));
  const [loginPath, setLoginPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kind = params.get("kind");
    const id = params.get("id");
    const role = params.get("role");
    if ((kind !== "document" && kind !== "board") || !id || (role !== "viewer" && role !== "editor")) {
      setMessage(t("invalid"));
      return;
    }
    setInvitation({ kind, id, role, title: params.get("title") || t("defaultTitle") });
  }, [t]);

  const respond = async (status: "accepted" | "declined") => {
    if (!invitation) return;
    setBusy(true);
    const resource = invitation.kind === "document" ? "documents" : "boards";
    try {
      const response = await fetch(`/api/workspace/${resource}/${invitation.id}/members/respond`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        setMessage(response.status === 401 ? t("loginRequired") : t("invalidAccess"));
        if (response.status === 401) setLoginPath(buildInvitationLoginPath(window.location.search));
        setBusy(false);
        return;
      }
      if (status === "declined") {
        setMessage(t("declined"));
        setBusy(false);
        return;
      }
      setMessage(t("accepted"));
      router.replace(
        invitation.kind === "document" ? `/docs/${invitation.id}` : `/whiteboard/${invitation.id}`
      );
    } catch {
      setMessage(t("responseFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg-canvas flex min-h-screen items-center justify-center p-6">
      <section className="border-default bg-surface w-full max-w-md rounded-2xl border p-6 shadow-[var(--shadow-card)]">
        <p className="text-body-sm text-muted">{t("eyebrow")}</p>
        <h1 className="mt-2 text-2xl font-semibold">{invitation?.title ?? t("defaultTitle")}</h1>
        {invitation ? (
          <>
            <p className="text-body-sm text-muted mt-3">
              {t("roleInvite", { role: invitation.role === "editor" ? t("editor") : t("viewer") })}
            </p>
            <Flex className="mt-6 flex gap-2">
              <Button disabled={busy} onClick={() => void respond("accepted")}>
                {busy ? t("loading") : t("accept")}
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => void respond("declined")}>
                {t("decline")}
              </Button>
            </Flex>
          </>
        ) : null}
        <p className="text-body-sm text-muted mt-4">{message}</p>
        {loginPath ? (
          <Button asChild variant="link" size="sm" className="mt-3 px-0">
            <a href={loginPath}>{t("continueAfterLogin")}</a>
          </Button>
        ) : null}
      </section>
    </main>
  );
}
