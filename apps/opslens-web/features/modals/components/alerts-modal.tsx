"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
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
  Select,
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
  onMoveToAlert: (alert: OpsAlert) => void;
};

export function AlertsModal({
  open,
  onOpenChange,
  alerts,
  onMarkAllRead,
  onMarkRead,
  onRemoveAlert,
  onMoveToAlert
}: AlertsModalProps) {
  const tAlerts = useTranslations("alerts");
  const unreadCount = alerts.filter((item) => !item.readAt).length;
  const [levelFilter, setLevelFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const sourceOptions = useMemo(() => [{ label: "모든 소스", value: "all" }, ...Array.from(new Set(alerts.map((alert) => alert.source).filter(Boolean))).map((source) => ({ label: source, value: source }))], [alerts]);
  const groupedSummary = useMemo(() => Array.from(alerts.reduce((groups, alert) => {
    const key = `${alert.source}:${alert.title}`;
    const current = groups.get(key) ?? { key, source: alert.source ?? "web", title: alert.title, count: 0, unread: 0 };
    current.count += 1;
    if (!alert.readAt) current.unread += 1;
    groups.set(key, current);
    return groups;
  }, new Map<string, { key: string; source: string; title: string; count: number; unread: number }>()).values()).filter((group) => group.count > 1).slice(0, 4), [alerts]);
  const recentAlerts = useMemo(() => alerts.filter((item) =>
    (levelFilter === "all" || item.level === levelFilter) &&
    (sourceFilter === "all" || item.source === sourceFilter) &&
    (readFilter === "all" || (readFilter === "unread" ? !item.readAt : Boolean(item.readAt)))
  ).slice(0, 30), [alerts, levelFilter, readFilter, sourceFilter]);
  const levelLabelMap = {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
    info: "info"
  } as const;
  const levelTextClassMap = {
    critical: "text-danger",
    high: "text-warning",
    medium: "text-warning",
    low: "text-muted",
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

          <Box className="grid min-w-0 gap-[var(--space-2)] sm:grid-cols-2">
            <Select className="min-w-0" aria-label="알림 심각도 필터" value={levelFilter} onChange={(value) => setLevelFilter(String(value))} options={[{ label: "모든 심각도", value: "all" }, { label: "Critical", value: "critical" }, { label: "High", value: "high" }, { label: "Medium", value: "medium" }, { label: "Info", value: "info" }]} />
            <Select className="min-w-0" aria-label="알림 읽음 상태 필터" value={readFilter} onChange={(value) => setReadFilter(String(value))} options={[{ label: "전체", value: "all" }, { label: "미확인", value: "unread" }, { label: "확인됨", value: "read" }]} />
            <Select className="min-w-0 sm:col-span-2" aria-label="알림 소스 필터" value={sourceFilter} onChange={(value) => setSourceFilter(String(value))} options={sourceOptions} />
          </Box>

          {groupedSummary.length > 0 ? <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-2)]"><Typography as="p" variant="caption" color="muted">반복 알림 묶음</Typography><Box className="mt-[var(--space-1)] space-y-[var(--space-1)]">{groupedSummary.map((group) => <Flex key={group.key} className="items-center justify-between gap-[var(--space-2)]"><Typography as="p" variant="caption" className="truncate">{group.source} · {group.title}</Typography><Badge size="sm" variant={group.unread > 0 ? "warning" : "secondary"}>{group.count}건</Badge></Flex>)}</Box></Box> : null}

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
                      onMoveToAlert(alert);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      onMarkRead(alert.id);
                      onMoveToAlert(alert);
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
