"use client";

import type { WorkspaceInvitation } from "@repo/utils/collab";
import { socketEventName } from "@repo/utils/collab";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/features/docs/documents/api";
import { fetchRealtimeAccountToken } from "@/lib/auth/realtime-token";
import { Badge, Button, Card, Typography, Flex, Grid } from "@repo/ui";

const invitationKey = (invitation: WorkspaceInvitation) => `${invitation.kind}:${invitation.id}`;

export function PendingInvitations() {
  const t = useTranslations("collab.pendingInvitations");
  const router = useRouter();
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const load = async () => {
    const response = await fetch("/api/invitations", { credentials: "include", cache: "no-store" });
    if (!response.ok) {
      if (response.status !== 401) setHasError(true);
      return;
    }

    const payload = (await response.json()) as { invitations?: WorkspaceInvitation[] };
    setInvitations(payload.invitations ?? []);
    setHasError(false);
  };

  useEffect(() => {
    void load();

    const socket = io(API_BASE_URL, { transports: ["websocket"], reconnection: true });
    void fetchRealtimeAccountToken().then((accountToken) => {
      if (accountToken) {
        socket.emit(socketEventName.notificationsSubscribe, { accountToken });
      }
    });
    socket.on(socketEventName.notificationsUpdate, () => void load());
    socket.on(socketEventName.invitationsUpdate, () => void load());
    return () => {
      socket.off(socketEventName.invitationsUpdate);
      socket.disconnect();
    };
  }, []);

  const respond = async (invitation: WorkspaceInvitation, status: "accepted" | "declined") => {
    const key = invitationKey(invitation);
    setActionPending(key);
    const resource = invitation.kind === "document" ? "documents" : "boards";

    try {
      const response = await fetch(`/api/workspace/${resource}/${invitation.id}/members/respond`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error(t("responseFailed"));

      setHasError(false);
      setInvitations((current) => current.filter((item) => invitationKey(item) !== key));
      if (status === "accepted") {
        router.push(
          invitation.kind === "document" ? `/docs/${invitation.id}` : `/whiteboard/${invitation.id}`
        );
      }
    } catch {
      setHasError(true);
    } finally {
      setActionPending(null);
    }
  };

  const dismissExpired = async (invitation: WorkspaceInvitation) => {
    const key = invitationKey(invitation);
    setActionPending(key);
    try {
      const response = await fetch(`/api/invitations/${invitation.kind}/${invitation.id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) throw new Error(t("dismissFailed"));
      setInvitations((current) => current.filter((item) => invitationKey(item) !== key));
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setActionPending(null);
    }
  };

  if (invitations.length === 0 && !hasError) return null;

  return (
    <section className="mb-6" aria-labelledby="pending-invitations-title">
      <Card className="border-default/80 bg-surface border p-5 shadow-[var(--shadow-card)]" radius="lg">
        <Flex className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Typography as="h2" variant="headingMd" id="pending-invitations-title">
              {t("title")}
            </Typography>
            <Typography as="p" variant="bodySm" color="muted" className="mt-1">
              {t("description")}
            </Typography>
          </div>
          {invitations.length > 0 ? <Badge variant="info">{invitations.length}</Badge> : null}
        </Flex>

        {hasError ? (
          <Typography as="p" variant="bodySm" color="danger" className="mt-4">
            {t("loadError")}
          </Typography>
        ) : null}

        {invitations.length > 0 ? (
          <Grid className="mt-4 grid gap-3 md:grid-cols-2">
            {invitations.map((invitation) => {
              const key = invitationKey(invitation);
              const pending = actionPending === key;
              const expired = invitation.expiresAt ? Date.parse(invitation.expiresAt) <= Date.now() : false;
              return (
                <div key={key} className="border-default/70 bg-surface-elevated rounded-xl border p-4">
                  <Flex className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Typography as="h3" variant="title" className="truncate">
                        {invitation.title}
                      </Typography>
                      <Typography as="p" variant="bodySm" color="muted" className="mt-1">
                        {invitation.kind === "document" ? t("document") : t("whiteboard")} ·{" "}
                        {invitation.email}
                      </Typography>
                    </div>
                    <Badge variant={expired ? "outline" : "info"}>
                      {expired ? t("expired") : t("invitation")}
                    </Badge>
                  </Flex>
                  <Flex className="mt-4 flex justify-end gap-2">
                    {expired ? (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={pending}
                        disabled={pending}
                        onClick={() => void dismissExpired(invitation)}
                      >
                        {t("close")}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => void respond(invitation, "declined")}
                        >
                          {t("decline")}
                        </Button>
                        <Button
                          size="sm"
                          loading={pending}
                          disabled={pending}
                          onClick={() => void respond(invitation, "accepted")}
                        >
                          {t("accept")}
                        </Button>
                      </>
                    )}
                  </Flex>
                </div>
              );
            })}
          </Grid>
        ) : null}
      </Card>
    </section>
  );
}
