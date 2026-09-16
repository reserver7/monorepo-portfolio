"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Box, Button, Checkbox, Flex, Grid, Input, Typography } from "@repo/ui";
import type { OpsReportAction } from "@repo/opslens";
import { formatDateTime } from "@repo/utils";

type ReportActionListProps = {
  actions: OpsReportAction[];
  disabled?: boolean;
  onToggle: (action: OpsReportAction, completed: boolean) => void;
  onUpdate: (action: OpsReportAction, values: { owner: string; dueAt: string }) => void;
};

export function ReportActionList({ actions, disabled, onToggle, onUpdate }: ReportActionListProps) {
  const t = useTranslations("reports");
  const locale = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { owner: string; dueAt: string }>>({});
  const edit = (action: OpsReportAction) => {
    setDrafts((previous) => ({
      ...previous,
      [action.id]: previous[action.id] ?? {
        owner: action.owner,
        dueAt: action.dueAt ? new Date(action.dueAt).toISOString().slice(0, 16) : ""
      }
    }));
    setEditingId(action.id);
  };
  return (
    <Box className="space-y-[var(--space-2)]">
      {actions.map((action) => {
        const isComplete = Boolean(action.completedAt);
        const overdue = !isComplete && action.dueAt && new Date(action.dueAt).getTime() < Date.now();
        return (
          <Box
            key={action.id}
            className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]"
          >
            <Flex className="items-start justify-between gap-[var(--space-3)]">
              <Flex className="min-w-0 gap-[var(--space-2)]">
                <Checkbox
                  checked={isComplete}
                  disabled={disabled}
                  aria-label={t("actionCompleteAria", { title: action.title })}
                  onCheckedChange={(checked) => onToggle(action, checked === true)}
                />
                <Box className="min-w-0">
                  <Typography as="p" variant="bodySm" className="font-semibold">
                    {action.title}
                  </Typography>
                  <Typography
                    as="p"
                    variant="caption"
                    color="muted"
                    className="mt-[var(--space-1)] leading-[1.5]"
                  >
                    {action.description}
                  </Typography>
                </Box>
              </Flex>
              <Badge
                variant={
                  action.priority === "P0" ? "danger" : action.priority === "P1" ? "warning" : "secondary"
                }
                size="sm"
                shape="rounded"
                className="shrink-0 font-semibold"
              >
                {action.priority}
              </Badge>
            </Flex>
            <Typography
              as="p"
              variant="caption"
              color={overdue ? "danger" : "subtle"}
              className="mt-[var(--space-2)]"
            >
              {t("actionMeta", {
                owner: action.owner,
                due: action.dueAt ? `${t("due")} ${formatDateTime(action.dueAt, locale)} · ` : "",
                status: isComplete
                  ? `${action.completedBy || t("operator")} ${t("completed")}`
                  : overdue
                    ? t("overdue")
                    : t("needsAction")
              })}
            </Typography>
            {editingId === action.id ? (
              <Grid className="mt-[var(--space-2)] gap-[var(--space-2)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                <Input
                  aria-label={t("ownerAria", { title: action.title })}
                  value={drafts[action.id]?.owner ?? action.owner}
                  onChange={(event) =>
                    setDrafts((previous) => ({
                      ...previous,
                      [action.id]: { owner: event.target.value, dueAt: previous[action.id]?.dueAt ?? "" }
                    }))
                  }
                />
                <Input
                  aria-label={t("dueAria", { title: action.title })}
                  type="datetime-local"
                  value={drafts[action.id]?.dueAt ?? ""}
                  onChange={(event) =>
                    setDrafts((previous) => ({
                      ...previous,
                      [action.id]: {
                        owner: previous[action.id]?.owner ?? action.owner,
                        dueAt: event.target.value
                      }
                    }))
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  loading={disabled ? true : undefined}
                  onClick={() => {
                    onUpdate(action, drafts[action.id] ?? { owner: action.owner, dueAt: action.dueAt ?? "" });
                    setEditingId(null);
                  }}
                >
                  {t("save")}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  {t("cancel")}
                </Button>
              </Grid>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-[var(--space-1)]"
                disabled={disabled}
                onClick={() => edit(action)}
              >
                {t("editOwnerDue")}
              </Button>
            )}
          </Box>
        );
      })}
      {actions.length === 0 ? (
        <Typography as="p" variant="bodySm" color="muted">
          {t("actions.empty")}
        </Typography>
      ) : null}
    </Box>
  );
}
