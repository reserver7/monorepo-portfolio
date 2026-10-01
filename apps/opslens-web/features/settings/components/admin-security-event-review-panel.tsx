"use client";

import type { OpsSecurityEvent, OpsSecurityEventDetails } from "@repo/opslens";
import { Badge, Box, Button, Checkbox, FormField, Input, Select, Textarea, Typography } from "@repo/ui";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AUDIT_SEVERITY_TONE, formatAuditListDateTime } from "../utils/settings-utils";

type ReviewStatus = OpsSecurityEvent["reviewStatus"];

const reviewStatusMessage = {
  unreviewed: "securityReviewStatus.unreviewed",
  in_review: "securityReviewStatus.inReview",
  resolved: "securityReviewStatus.resolved"
} as const;

export function AdminSecurityEventReviewPanel({
  events,
  totalCount,
  page,
  pageSize,
  loading,
  reviewStatus,
  severity,
  assigneeFilter,
  selectedEvent,
  details,
  detailsLoading,
  selectedEventIds,
  pending,
  bulkPending,
  onReviewStatusChange,
  onSeverityChange,
  onAssigneeFilterChange,
  onPageChange,
  onSelect,
  onSave,
  onToggleSelection,
  onToggleAll,
  onBulkSave
}: {
  events: OpsSecurityEvent[];
  totalCount: number;
  page: number;
  pageSize: number;
  loading: boolean;
  reviewStatus: ReviewStatus | "all";
  severity: string;
  assigneeFilter: string;
  selectedEvent?: OpsSecurityEvent;
  details?: OpsSecurityEventDetails;
  detailsLoading: boolean;
  selectedEventIds: string[];
  pending: boolean;
  bulkPending: boolean;
  onReviewStatusChange: (value: ReviewStatus | "all") => void;
  onSeverityChange: (value: string) => void;
  onAssigneeFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onSelect: (event: OpsSecurityEvent) => void;
  onToggleSelection: (eventId: string) => void;
  onToggleAll: (checked: boolean) => void;
  onSave: (
    eventId: string,
    input: { reviewStatus: ReviewStatus; assignee?: string; reviewNote?: string }
  ) => void;
  onBulkSave: (input: { reviewStatus: ReviewStatus; assignee?: string; reviewNote?: string }) => void;
}) {
  const t = useTranslations("settings.screen");
  const [draftStatus, setDraftStatus] = useState<ReviewStatus>(selectedEvent?.reviewStatus ?? "unreviewed");
  const [draftAssignee, setDraftAssignee] = useState(selectedEvent?.reviewedBy ?? "");
  const [draftNote, setDraftNote] = useState(selectedEvent?.reviewNote ?? "");
  const [bulkStatus, setBulkStatus] = useState<ReviewStatus>("in_review");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkNote, setBulkNote] = useState("");

  useEffect(() => {
    setDraftStatus(selectedEvent?.reviewStatus ?? "unreviewed");
    setDraftAssignee(selectedEvent?.reviewedBy ?? "");
    setDraftNote(selectedEvent?.reviewNote ?? "");
  }, [selectedEvent]);

  const statusOptions = [
    { label: t("securityReviewStatus.all"), value: "all" },
    { label: t("securityReviewStatus.unreviewed"), value: "unreviewed" },
    { label: t("securityReviewStatus.inReview"), value: "in_review" },
    { label: t("securityReviewStatus.resolved"), value: "resolved" }
  ];
  const severityOptions = [
    { label: t("securityReviewSeverity.all"), value: "all" },
    { label: "critical", value: "critical" },
    { label: "warning", value: "warning" },
    { label: "info", value: "info" }
  ];
  const draftStatusOptions = statusOptions.filter((option) => option.value !== "all");
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const allVisibleSelected =
    events.length > 0 && events.every((event) => selectedEventIds.includes(event.id));
  const detailValues: Array<{ label: string; value: unknown }> = details
    ? [
        { label: t("securityEventBefore"), value: details.beforeValue },
        { label: t("securityEventAfter"), value: details.afterValue },
        { label: t("securityEventMetadata"), value: details.metadata }
      ]
    : [];

  return (
    <Box className="border-default bg-surface rounded-[var(--radius-md)] border p-[var(--space-4)]">
      <Typography as="h3" variant="headingMd">
        {t("securityEventsTitle")}
      </Typography>
      <Box className="mt-3 grid gap-2 md:grid-cols-3">
        <Select
          aria-label={t("securityReviewStatus.label")}
          value={reviewStatus}
          options={statusOptions}
          onChange={(value) => onReviewStatusChange(String(value) as ReviewStatus | "all")}
        />
        <Select
          aria-label={t("securityReviewSeverity.label")}
          value={severity}
          options={severityOptions}
          onChange={(value) => onSeverityChange(String(value))}
        />
        <Input
          aria-label={t("securityReviewAssigneeFilter")}
          placeholder={t("securityReviewAssigneeFilter")}
          value={assigneeFilter}
          onChange={(event) => onAssigneeFilterChange(event.target.value)}
        />
      </Box>
      <Box className="mt-3 flex items-center justify-between gap-3">
        <Checkbox
          aria-label={t("securityReviewSelectAll")}
          checked={allVisibleSelected}
          indeterminate={selectedEventIds.length > 0 && !allVisibleSelected}
          onCheckedChange={onToggleAll}
          label={t("securityReviewSelectAll")}
        />
        {selectedEventIds.length > 0 ? (
          <Typography as="span" variant="caption" color="muted">
            {t("securityReviewSelectedCount", { count: selectedEventIds.length })}
          </Typography>
        ) : null}
      </Box>
      {loading ? (
        <Typography as="p" variant="bodySm" color="muted" className="mt-3">
          {t("securityEventsLoading")}
        </Typography>
      ) : events.length === 0 ? (
        <Typography as="p" variant="bodySm" color="muted" className="mt-3">
          {t("securityEventsEmpty")}
        </Typography>
      ) : (
        <Box className="divide-default border-default mt-3 divide-y border-y">
          {events.map((event) => (
            <Box key={event.id} className="flex items-center gap-3 py-3">
              <Checkbox
                aria-label={t("securityReviewSelectEvent", { summary: event.summary })}
                checked={selectedEventIds.includes(event.id)}
                onCheckedChange={() => onToggleSelection(event.id)}
              />
              <Button
                type="button"
                variant="ghost"
                className="!h-auto min-w-0 flex-1 justify-between !rounded-none text-left"
                onClick={() => onSelect(event)}
              >
                <Box className="min-w-0">
                  <Typography as="p" variant="bodySm" className="truncate">
                    {event.summary}
                  </Typography>
                  <Typography as="p" variant="caption" color="muted">
                    {event.actor} · {event.reviewedBy ?? t("securityReviewUnassigned")} ·{" "}
                    {formatAuditListDateTime(event.createdAt)}
                  </Typography>
                </Box>
                <Box className="flex shrink-0 items-center gap-2">
                  <Badge variant={AUDIT_SEVERITY_TONE[event.severity] ?? "secondary"} size="sm">
                    {event.severity}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {t(reviewStatusMessage[event.reviewStatus])}
                  </Badge>
                </Box>
              </Button>
            </Box>
          ))}
        </Box>
      )}
      {totalPages > 1 ? (
        <Box className="mt-3 flex items-center justify-between">
          <Typography as="span" variant="caption" color="muted">
            {t("securityEventsPage", { page, totalPages })}
          </Typography>
          <Box className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              {t("previous")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              {t("next")}
            </Button>
          </Box>
        </Box>
      ) : null}
      {selectedEvent ? (
        <Box className="border-default mt-4 border-t pt-4">
          <Typography as="h4" variant="bodySm" className="font-semibold">
            {t("securityEventDetailsTitle")}
          </Typography>
          {detailsLoading ? (
            <Typography as="p" variant="caption" color="muted" className="mt-2">
              {t("securityEventDetailsLoading")}
            </Typography>
          ) : details ? (
            <Box className="mt-3 grid gap-3">
              <Typography as="p" variant="caption" color="muted">
                {details.targetType} · {details.targetId ?? t("securityEventNoTarget")} · {details.actor}
              </Typography>
              <Box className="grid gap-3 md:grid-cols-3">
                {detailValues.map(({ label, value }) => (
                  <Box
                    key={label}
                    className="border-default bg-surface-muted rounded-[var(--radius-sm)] border p-3"
                  >
                    <Typography as="p" variant="caption" color="muted">
                      {label}
                    </Typography>
                    <Typography
                      as="pre"
                      variant="caption"
                      className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words"
                    >
                      {JSON.stringify(value ?? null, null, 2)}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box>
                <Typography as="p" variant="caption" color="muted">
                  {t("securityEventRelatedTitle")}
                </Typography>
                {details.relatedEvents.length === 0 ? (
                  <Typography as="p" variant="caption" color="muted" className="mt-2">
                    {t("securityEventRelatedEmpty")}
                  </Typography>
                ) : (
                  <Box className="divide-default border-default mt-2 divide-y border-y">
                    {details.relatedEvents.map((relatedEvent) => (
                      <Box key={relatedEvent.id} className="flex items-center justify-between gap-3 py-2">
                        <Box className="min-w-0">
                          <Typography as="p" variant="caption" className="truncate">
                            {relatedEvent.summary}
                          </Typography>
                          <Typography as="p" variant="caption" color="muted">
                            {relatedEvent.action}
                          </Typography>
                        </Box>
                        <Badge variant={AUDIT_SEVERITY_TONE[relatedEvent.severity] ?? "secondary"} size="sm">
                          {relatedEvent.severity}
                        </Badge>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          ) : null}
          <Typography as="h4" variant="bodySm" className="font-semibold">
            {t("securityReviewTitle")}
          </Typography>
          <Box className="mt-3 grid gap-3 md:grid-cols-2">
            <FormField label={t("securityReviewStatus.label")} htmlFor="security-review-status">
              <Select
                value={draftStatus}
                options={draftStatusOptions}
                onChange={(value) => setDraftStatus(String(value) as ReviewStatus)}
              />
            </FormField>
            <FormField label={t("securityReviewAssignee")} htmlFor="security-review-assignee">
              <Input
                id="security-review-assignee"
                type="email"
                value={draftAssignee}
                onChange={(event) => setDraftAssignee(event.target.value)}
              />
            </FormField>
          </Box>
          <FormField label={t("securityReviewNote")} htmlFor="security-review-note" className="mt-3">
            <Textarea
              id="security-review-note"
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value)}
              rows={3}
              maxLength={500}
            />
          </FormField>
          <Button
            type="button"
            className="mt-3"
            loading={pending}
            disabled={draftNote.trim().length === 1}
            onClick={() =>
              onSave(selectedEvent.id, {
                reviewStatus: draftStatus,
                assignee: draftAssignee.trim() || undefined,
                reviewNote: draftNote.trim() || undefined
              })
            }
          >
            {t("securityReviewSave")}
          </Button>
        </Box>
      ) : null}
      {selectedEventIds.length > 0 ? (
        <Box className="border-default mt-4 border-t pt-4">
          <Typography as="h4" variant="bodySm" className="font-semibold">
            {t("securityBulkReviewTitle")}
          </Typography>
          <Typography as="p" variant="caption" color="muted" className="mt-1">
            {t("securityReviewSelectedCount", { count: selectedEventIds.length })}
          </Typography>
          <Box className="mt-3 grid gap-3 md:grid-cols-2">
            <FormField label={t("securityReviewStatus.label")} htmlFor="security-bulk-review-status">
              <Select
                value={bulkStatus}
                options={draftStatusOptions}
                onChange={(value) => setBulkStatus(String(value) as ReviewStatus)}
              />
            </FormField>
            <FormField label={t("securityReviewAssignee")} htmlFor="security-bulk-review-assignee">
              <Input
                id="security-bulk-review-assignee"
                type="email"
                value={bulkAssignee}
                onChange={(event) => setBulkAssignee(event.target.value)}
              />
            </FormField>
          </Box>
          <FormField label={t("securityReviewNote")} htmlFor="security-bulk-review-note" className="mt-3">
            <Textarea
              id="security-bulk-review-note"
              value={bulkNote}
              onChange={(event) => setBulkNote(event.target.value)}
              rows={3}
              maxLength={500}
            />
          </FormField>
          <Button
            type="button"
            className="mt-3"
            loading={bulkPending}
            disabled={bulkNote.trim().length === 1}
            onClick={() =>
              onBulkSave({
                reviewStatus: bulkStatus,
                assignee: bulkAssignee.trim() || undefined,
                reviewNote: bulkNote.trim() || undefined
              })
            }
          >
            {t("securityBulkReviewSave")}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
