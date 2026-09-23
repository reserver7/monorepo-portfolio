"use client";

import type { WorkspaceNotification } from "@repo/utils/collab";
import { socketEventName } from "@repo/utils/collab";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { Button, Flex } from "@repo/ui";
import { API_BASE_URL } from "@/features/docs/documents/api";
import { fetchRealtimeAccountToken } from "@/lib/auth/realtime-token";
import {
  getWorkspaceNotificationLabel,
  getWorkspaceNotificationPath,
  markWorkspaceNotificationRead
} from "@/features/common/model/workspace-notifications";

export function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const response = await fetch("/api/notifications", { credentials: "include", cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      notifications?: WorkspaceNotification[];
      unreadCount?: number;
    };
    setNotifications(payload.notifications ?? []);
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

  const markAllRead = async () => {
    const response = await fetch("/api/notifications/read-all", {
      method: "PATCH",
      credentials: "include"
    });
    if (!response.ok) return;
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((notification) => ({ ...notification, readAt })));
    setUnreadCount(0);
  };

  const openNotification = async (notification: WorkspaceNotification) => {
    if (!notification.readAt) {
      await markWorkspaceNotificationRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }
    setOpen(false);
    router.push(getWorkspaceNotificationPath(notification));
  };

  return (
    <div className="fixed right-4 top-4 z-50">
      <Button
        variant="secondary"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        알림{unreadCount > 0 ? ` ${unreadCount}` : ""}
      </Button>
      {open ? (
        <div className="border-default bg-surface mt-2 w-80 rounded-xl border p-3 shadow-[var(--shadow-card)]">
          <Flex className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">최근 알림</h2>
            <Button variant="text" size="sm" disabled={unreadCount === 0} onClick={() => void markAllRead()}>
              모두 읽음
            </Button>
          </Flex>
          {notifications.length > 0 ? (
            <ul className="mt-2 grid gap-1">
              {notifications.slice(0, 10).map((notification) => (
                <li key={notification.id}>
                  <Button
                    variant="text"
                    fullWidth
                    className={`w-full rounded-lg p-2 text-left text-xs ${notification.readAt ? "text-muted" : "bg-primary/10"}`}
                    onClick={() => void openNotification(notification)}
                  >
                    <span className="font-medium">{notification.title}</span>
                    <span className="mt-1 block">{getWorkspaceNotificationLabel(notification)}</span>
                    <span className="text-muted mt-1 block">
                      {new Date(notification.at).toLocaleString("ko-KR")}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-sm text-muted mt-2">새 알림이 없습니다.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
