"use client";

import type { WorkspaceNotification } from "@repo/utils/collab";
import { socketEventName } from "@repo/utils/collab";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/features/docs/documents/api";
import { getPendingInvitations } from "@/features/common/model/pending-invitations";
import { fetchRealtimeAccountToken } from "@/lib/auth/realtime-token";
import { Badge, Button, Card, Typography, Flex, Grid } from "@repo/ui";

const notificationKey = (notification: WorkspaceNotification) =>
  `${notification.entityKind}:${notification.entityId}`;

export function PendingInvitations() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<WorkspaceNotification[]>([]);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const load = async () => {
    const response = await fetch("/api/notifications", { credentials: "include", cache: "no-store" });
    if (!response.ok) {
      if (response.status !== 401) setHasError(true);
      return;
    }

    const payload = (await response.json()) as { notifications?: WorkspaceNotification[] };
    setInvitations(getPendingInvitations(payload.notifications ?? []));
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
    return () => {
      socket.disconnect();
    };
  }, []);

  const respond = async (notification: WorkspaceNotification, status: "accepted" | "declined") => {
    const key = notificationKey(notification);
    setActionPending(key);
    const resource = notification.entityKind === "document" ? "documents" : "boards";

    try {
      const response = await fetch(`/api/workspace/${resource}/${notification.entityId}/members/respond`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("초대 응답에 실패했습니다.");

      await fetch(`/api/notifications/${notification.id}/read`, {
        method: "PATCH",
        credentials: "include"
      });
      setHasError(false);
      setInvitations((current) => current.filter((item) => notificationKey(item) !== key));
      if (status === "accepted") {
        router.push(
          notification.entityKind === "document"
            ? `/docs/${notification.entityId}`
            : `/whiteboard/${notification.entityId}`
        );
      }
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
              받은 초대
            </Typography>
            <Typography as="p" variant="bodySm" color="muted" className="mt-1">
              작업 공간에 참여할 초대를 확인하세요.
            </Typography>
          </div>
          {invitations.length > 0 ? <Badge variant="info">{invitations.length}</Badge> : null}
        </Flex>

        {hasError ? (
          <Typography as="p" variant="bodySm" color="danger" className="mt-4">
            초대 목록을 처리하지 못했습니다. 잠시 후 다시 시도하세요.
          </Typography>
        ) : null}

        {invitations.length > 0 ? (
          <Grid className="mt-4 grid gap-3 md:grid-cols-2">
            {invitations.map((invitation) => {
              const key = notificationKey(invitation);
              const pending = actionPending === key;
              return (
                <div key={key} className="border-default/70 bg-surface-elevated rounded-xl border p-4">
                  <Flex className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Typography as="h3" variant="title" className="truncate">
                        {invitation.title}
                      </Typography>
                      <Typography as="p" variant="bodySm" color="muted" className="mt-1">
                        {invitation.entityKind === "document" ? "문서" : "화이트보드"} ·{" "}
                        {invitation.memberEmail}
                      </Typography>
                    </div>
                    <Badge variant="outline">초대</Badge>
                  </Flex>
                  <Flex className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => void respond(invitation, "declined")}
                    >
                      거절
                    </Button>
                    <Button
                      size="sm"
                      loading={pending}
                      disabled={pending}
                      onClick={() => void respond(invitation, "accepted")}
                    >
                      수락
                    </Button>
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
