"use client";

import { useTranslations } from "next-intl";
import { CheckCheck, X } from "lucide-react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  Typography
} from "@repo/ui";
import type { OpsAlert } from "@/features/alerts";
import { formatDateTime } from "@repo/utils";

type AlertsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts: OpsAlert[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onRemoveAlert: (id: string) => void;
  onMoveToIssues: (id: string) => void;
};

export function AlertsModal({
  open,
  onOpenChange,
  alerts,
  onMarkAllRead,
  onMarkRead,
  onRemoveAlert,
  onMoveToIssues
}: AlertsModalProps) {
  const tAlerts = useTranslations("alerts");
  const unreadCount = alerts.filter((item) => !item.readAt).length;
  const recentAlerts = alerts.slice(0, 12);
  const levelLabelMap = {
    critical: "critical",
    high: "high",
    info: "info"
  } as const;
  const levelTextClassMap = {
    critical: "text-danger",
    high: "text-warning",
    info: "text-muted"
  } as const;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm" className="p-[var(--space-4)] sm:p-[var(--space-5)]">
        <ModalHeader className="mb-[var(--space-3)] pr-[var(--space-8)]">
          <ModalTitle className="text-body-lg font-semibold">{tAlerts("title")}</ModalTitle>
          <ModalDescription className="text-caption leading-[var(--line-height-normal)]">
            {tAlerts("description")}
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-[var(--space-3)]">
          <Flex className="border-default bg-surface-elevated items-center justify-between rounded-[var(--radius-md)] border px-[var(--space-3)] py-[var(--space-2)]">
            <Flex className="items-center gap-[var(--space-2-5)]">
              <Typography as="p" variant="caption" color="subtle" className="font-semibold">
                {tAlerts("unread")}
              </Typography>
              <Badge
                variant={unreadCount > 0 ? "danger" : "secondary"}
                size="sm"
                shape="rounded"
                className="border border-current/20 font-semibold"
              >
                {unreadCount}
              </Badge>
            </Flex>
            {unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<CheckCheck className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
                className="h-7 border-transparent !bg-transparent px-[var(--space-2)] text-caption text-muted hover:!bg-surface hover:text-foreground"
                onClick={onMarkAllRead}
              >
                {tAlerts("markAllRead")}
              </Button>
            ) : (
              <Typography as="span" variant="caption" color="subtle">
                모두 확인됨
              </Typography>
            )}
          </Flex>

          {recentAlerts.length > 0 ? (
            <Box className="max-h-[300px] overflow-y-auto pr-[var(--space-1)]">
              <Box className="divide-y divide-default border-y border-default">
              {recentAlerts.map((alert) => {
                const unread = !alert.readAt;
                return (
                  <Box
                    key={alert.id}
                    role="button"
                    tabIndex={0}
                    className={`focus-visible:ring-primary focus-visible:ring-offset-surface group relative cursor-pointer px-[var(--space-2)] py-[var(--space-2-5)] pr-[var(--space-7)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      unread ? "bg-surface" : "bg-surface text-muted"
                    } hover:bg-surface-elevated`}
                    onClick={() => {
                      onMarkRead(alert.id);
                      onMoveToIssues(alert.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      onMarkRead(alert.id);
                      onMoveToIssues(alert.id);
                    }}
                  >
                    <Flex className="items-start gap-[var(--space-2)]">
                      <Box className={`mt-[var(--space-1-5)] h-[var(--space-1-5)] w-[var(--space-1-5)] shrink-0 rounded-full ${
                        alert.level === "critical"
                          ? "bg-danger"
                          : alert.level === "high"
                            ? "bg-warning"
                            : "bg-muted"
                      }`} />
                      <Box className="min-w-0 flex-1">
                        <Typography as="p" variant="caption" className={`line-clamp-2 pr-[var(--space-2)] ${unread ? "font-semibold text-foreground" : "text-muted"}`}>
                            {alert.title}
                        </Typography>
                        <Flex className="mt-[var(--space-1)] flex-wrap items-center gap-x-[var(--space-2)] gap-y-[var(--space-1)]">
                          <Typography as="span" variant="caption" className={`font-semibold uppercase ${levelTextClassMap[alert.level]}`}>
                            {levelLabelMap[alert.level]}
                          </Typography>
                          {alert.source ? (
                            <Typography as="span" variant="caption" color="subtle" className="font-mono">
                              {alert.source}
                            </Typography>
                          ) : null}
                          <Typography as="span" variant="caption" color="subtle">
                            {formatDateTime(alert.createdAt)}
                          </Typography>
                          {unread ? (
                            <Typography as="span" variant="caption" className="font-semibold text-primary">
                              New
                            </Typography>
                          ) : null}
                        </Flex>
                      </Box>
                    </Flex>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      leftIcon={<X />}
                      aria-label={tAlerts("remove")}
                      className="absolute right-[var(--space-1)] top-[var(--space-2)] h-6 w-6 border-transparent !bg-transparent text-muted opacity-0 hover:!bg-danger/10 hover:text-danger group-hover:opacity-70 focus-visible:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveAlert(alert.id);
                      }}
                    />
                  </Box>
                );
              })}
              </Box>
            </Box>
          ) : (
            <Box className="border-default rounded-[var(--radius-md)] border border-dashed py-[var(--space-6)] text-center">
              <Typography as="p" variant="caption" color="muted">
                {tAlerts("none")}
              </Typography>
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
