"use client";

import type { WorkspaceNotification } from "@repo/utils/collab";
import { socketEventName } from "@repo/utils/collab";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Typography, Flex } from "@repo/ui";
import { API_BASE_URL } from "@/features/docs/documents/api";
import { fetchRealtimeAccountToken } from "@/lib/auth/realtime-token";
import {
  getWorkspaceNotificationLabel,
  getWorkspaceNotificationPath,
  markWorkspaceNotificationRead
} from "@/features/common/model/workspace-notifications";

export function RecentWorkspaceActivity() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    const response = await fetch("/api/notifications", { credentials: "include", cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      notifications?: WorkspaceNotification[];
      unreadCount?: number;
    };
    setNotifications((payload.notifications ?? []).slice(0, 10));
    setUnreadCount(payload.unreadCount ?? 0);
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

  const openActivity = async (notification: WorkspaceNotification) => {
    if (!notification.readAt) {
      await markWorkspaceNotificationRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }
    router.push(getWorkspaceNotificationPath(notification));
  };

  return (
    <section className="border-default bg-surface mb-6 rounded-2xl border p-5 shadow-[var(--shadow-card)]">
      <Flex className="flex items-center justify-between gap-3">
        <div>
          <Typography as="h2" variant="headingMd">
            최근 활동
          </Typography>
          <Typography as="p" variant="bodySm" color="muted" className="mt-1">
            작업 공간에서 발생한 최근 협업 소식입니다.
          </Typography>
        </div>
        {unreadCount > 0 ? <Badge variant="info">읽지 않음 {unreadCount}</Badge> : null}
      </Flex>

      {notifications.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Button
                variant="text"
                fullWidth
                className={`hover:border-primary/40 w-full rounded-xl border p-3 text-left transition ${notification.readAt ? "border-default text-muted" : "border-primary/30 bg-primary/5"}`}
                onClick={() => void openActivity(notification)}
              >
                <Flex className="flex items-start justify-between gap-3">
                  <span className="font-medium">{notification.title}</span>
                  {!notification.readAt ? <span className="text-primary text-xs">새 활동</span> : null}
                </Flex>
                <span className="mt-1 block text-sm">{getWorkspaceNotificationLabel(notification)}</span>
                <span className="text-muted mt-1 block text-xs">
                  {new Date(notification.at).toLocaleString("ko-KR")}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="bg-surface-elevated mt-4 p-4" radius="md">
          <Typography as="p" variant="bodySm" color="muted">
            아직 표시할 활동이 없습니다.
          </Typography>
        </Card>
      )}
    </section>
  );
}
