"use client";

import { Box, Flex, StateView, Typography } from "@repo/ui";
import { formatNumber } from "@repo/utils";
import type { OpsReport } from "@repo/opslens";
import { SeverityBadge, StatusBadge } from "@/features";

type ReportPriorityIssuesProps = {
  issues: OpsReport["priorityIssues"];
};

export function ReportPriorityIssues({ issues }: ReportPriorityIssuesProps) {
  if (issues.length === 0) {
    return <StateView variant="empty" size="sm" title="우선 대응 이슈가 없습니다." className="mt-[var(--space-3)]" />;
  }

  return (
    <Box className="space-y-[var(--space-2)]">
      {issues.map((issue) => (
        <Box key={issue.issueId} className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
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
              {formatNumber(issue.occurrenceCount)}회
            </Typography>
          </Flex>
        </Box>
      ))}
    </Box>
  );
}
