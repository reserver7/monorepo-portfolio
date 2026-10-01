"use client";

import type { OpsSecurityNotificationList } from "@repo/opslens";
import { Badge, Box, Button, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";
import { AUDIT_SEVERITY_TONE, formatAuditListDateTime } from "../utils/settings-utils";

export function AdminSecurityNotificationPanel({
  data,
  loading,
  pendingId,
  onSelect
}: {
  data?: OpsSecurityNotificationList;
  loading: boolean;
  pendingId?: string;
  onSelect: (notification: OpsSecurityNotificationList["items"][number]) => void;
}) {
  const t = useTranslations("settings.screen");
  return (
    <Box className="border-default bg-surface rounded-[var(--radius-md)] border p-[var(--space-4)]">
      <Box className="flex items-center justify-between gap-3">
        <Typography as="h3" variant="headingMd">
          {t("securityNotificationsTitle")}
        </Typography>
        {data && data.unreadCount > 0 ? (
          <Badge variant="danger" size="sm">
            {data.unreadCount}
          </Badge>
        ) : null}
      </Box>
      {loading ? (
        <Typography as="p" variant="bodySm" color="muted" className="mt-3">
          {t("securityNotificationsLoading")}
        </Typography>
      ) : !data || data.items.length === 0 ? (
        <Typography as="p" variant="bodySm" color="muted" className="mt-3">
          {t("securityNotificationsEmpty")}
        </Typography>
      ) : (
        <Box className="divide-default border-default mt-3 divide-y border-y">
          {data.items.map((notification) => (
            <Button
              key={notification.id}
              type="button"
              variant="ghost"
              className="!h-auto w-full justify-between !rounded-none py-3 text-left"
              loading={pendingId === notification.id}
              onClick={() => onSelect(notification)}
            >
              <Box className="min-w-0">
                <Typography as="p" variant="bodySm" className="truncate">
                  {notification.event.summary}
                </Typography>
                <Typography as="p" variant="caption" color="muted">
                  {formatAuditListDateTime(notification.event.createdAt)}
                </Typography>
              </Box>
              <Box className="flex shrink-0 items-center gap-2">
                <Badge variant={AUDIT_SEVERITY_TONE[notification.event.severity] ?? "secondary"} size="sm">
                  {notification.event.severity}
                </Badge>
                {!notification.readAt ? (
                  <Badge variant="warning" size="sm">
                    {t("securityNotificationUnread")}
                  </Badge>
                ) : null}
              </Box>
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
}
