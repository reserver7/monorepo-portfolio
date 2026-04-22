"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCheck, Circle } from "lucide-react";
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

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm" className="px-[var(--panel-padding-x)] py-[var(--panel-padding-y)]">
        <ModalHeader className="mb-[var(--space-3)]">
          <ModalTitle>{tAlerts("title")}</ModalTitle>
          <ModalDescription>{tAlerts("description")}</ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-[var(--panel-gap)]">
          <Flex className="border-default bg-surface-elevated items-center justify-between rounded-[var(--radius-md)] border px-[var(--space-2-5)] py-[var(--space-2)]">
            <Flex className="items-center gap-[var(--space-2)]">
              <Typography as="p" variant="caption" color="muted">
                {tAlerts("unread")}
              </Typography>
              <Badge
                variant={unreadCount > 0 ? "dangerSolid" : "secondary"}
                size="sm"
                shape="pill"
                className="h-[var(--size-chip-sm)] min-w-[var(--size-chip-sm)] justify-center px-[var(--space-1)] text-[10px] font-semibold leading-none"
              >
                {unreadCount}
              </Badge>
            </Flex>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
              className="h-[var(--size-control-sm)] px-[var(--space-2)] text-[11px]"
              onClick={onMarkAllRead}
            >
              {tAlerts("markAllRead")}
            </Button>
          </Flex>

          {recentAlerts.length > 0 ? (
            <Flex className="max-h-[320px] flex-col gap-[var(--space-1-5)] overflow-y-auto pr-[var(--space-1)]">
              {recentAlerts.map((alert) => {
                return (
                  <Badge
                    key={alert.id}
                    variant={alert.readAt ? "outline" : "info"}
                    size="md"
                    shape="pill"
                    truncate
                    maxWidth="100%"
                    interactive
                    removable
                    removeLabel={tAlerts("remove")}
                    onRemove={() => onRemoveAlert(alert.id)}
                    className={`h-[var(--chip-height)] w-full cursor-pointer justify-between gap-[var(--space-2)] px-[var(--space-3)] text-body-sm ${
                      alert.readAt
                        ? "text-foreground bg-surface hover:bg-surface-elevated border-default"
                        : "text-foreground border-primary/35 bg-primary/10 hover:bg-primary/15"
                    }`}
                    leftSlot={
                      <AlertTriangle
                        className={`${
                          alert.level === "critical"
                            ? "text-danger"
                            : alert.level === "high"
                              ? "text-warning"
                              : "text-primary"
                        } h-[var(--size-icon-sm)] w-[var(--size-icon-sm)]`}
                      />
                    }
                    rightSlot={!alert.readAt ? <Circle className="text-primary h-2.5 w-2.5 fill-current" /> : null}
                    onClick={() => {
                      onMarkRead(alert.id);
                      onMoveToIssues(alert.id);
                    }}
                  >
                    {alert.title}
                  </Badge>
                );
              })}
            </Flex>
          ) : (
            <Box className="text-center">
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
