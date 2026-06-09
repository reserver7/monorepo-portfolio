"use client";

import { Badge, Box, Flex, Grid, StatCard, Typography } from "@repo/ui";
import type { OpsReport } from "@repo/opslens";
import { getReportGeneratedLabel, getReportRiskBadge, getReportTone } from "../utils/report-utils";

type ReportSummaryPanelProps = {
  report: OpsReport;
};

export function ReportSummaryPanel({ report }: ReportSummaryPanelProps) {
  const risk = getReportRiskBadge(report.riskLevel);

  return (
    <Box className="space-y-[var(--space-3)]">
      <Flex className="items-start justify-between gap-[var(--space-3)]">
        <Box className="min-w-0">
          <Typography as="p" variant="bodyMd" className="font-semibold">
            {report.title}
          </Typography>
          <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-1)]">
            생성: {getReportGeneratedLabel(report)}
          </Typography>
        </Box>
        <Badge variant={risk.variant} size="sm" shape="rounded" className="shrink-0 font-semibold">
          {risk.label}
        </Badge>
      </Flex>

      <Grid className="gap-[var(--space-3)] md:grid-cols-3">
        {report.kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            helper={kpi.helper}
            color={getReportTone(kpi.tone)}
            size="sm"
            className="h-full rounded-[var(--radius-lg)]"
          />
        ))}
      </Grid>

      <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Typography as="p" variant="bodySm" className="font-semibold">
          경영/운영 요약
        </Typography>
        <Typography as="p" variant="bodySm" color="muted" className="mt-[var(--space-2)] leading-[1.7]">
          {report.executiveSummary}
        </Typography>
      </Box>
    </Box>
  );
}
