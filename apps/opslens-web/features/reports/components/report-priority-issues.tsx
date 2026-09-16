"use client";

import { FeedbackState } from "@/features/common/components/feedback-state";

import { Box, Flex, Typography } from "@repo/ui";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@repo/utils";
import type { OpsReport } from "@repo/opslens";
import { SeverityBadge, StatusBadge } from "@/features";

type ReportPriorityIssuesProps = {
  issues: OpsReport["priorityIssues"];
};

export function ReportPriorityIssues({ issues }: ReportPriorityIssuesProps) {
  const t = useTranslations("reports");
  const locale = useLocale();
  if (issues.length === 0) {
    return (
      <FeedbackState variant="empty" size="sm" title={t("priority.empty")} className="mt-[var(--space-3)]" />
    );
  }

  return (
    <Box className="space-y-[var(--space-2)]">
      {issues.map((issue) => (
        <Box
          key={issue.issueId}
          className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]"
        >
          <Typography as="p" variant="bodySm" className="line-clamp-2 font-semibold">
            {issue.title}
          </Typography>
          <Flex className="mt-[var(--space-2)] flex-wrap items-center gap-[var(--space-2)]">
            <SeverityBadge severity={issue.severity} />
            <StatusBadge status={issue.status} />
            <Typography as="span" variant="caption" color="muted">
              {issue.serviceName}
            </Typography>
            <Typography as="span" variant="caption" color="muted">
              {t("occurrences", { count: formatNumber(issue.occurrenceCount, locale) })}
            </Typography>
          </Flex>
        </Box>
      ))}
    </Box>
  );
}
