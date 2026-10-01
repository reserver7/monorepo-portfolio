"use client";

import type { OpsAdminSecuritySummary } from "@repo/opslens";
import { Badge, Box, Grid, Typography } from "@repo/ui";
import { useTranslations } from "next-intl";
import { AUDIT_SEVERITY_TONE, formatAuditListDateTime } from "../utils/settings-utils";

export function AdminSecuritySummaryPanel({
  summary,
  loading
}: {
  summary?: OpsAdminSecuritySummary;
  loading: boolean;
}) {
  const t = useTranslations("settings.screen");
  if (loading)
    return (
      <Typography as="p" variant="bodySm" color="muted">
        {t("securitySummaryLoading")}
      </Typography>
    );
  if (!summary)
    return (
      <Typography as="p" variant="bodySm" color="muted">
        {t("securitySummaryUnavailable")}
      </Typography>
    );

  const metrics = [
    [t("securityMetrics.totalUsers"), summary.metrics.totalUsers],
    [t("securityMetrics.activeUsers"), summary.metrics.activeUsers],
    [t("securityMetrics.activeSessions"), summary.metrics.activeSessions],
    [t("securityMetrics.pendingInvitations"), summary.metrics.pendingInvitations],
    [t("securityMetrics.recentAdminActions"), summary.metrics.recentAdminActions],
    [t("securityMetrics.highRiskEvents"), summary.metrics.highRiskEvents],
    [t("securityMetrics.unreviewedHighRiskEvents"), summary.metrics.unreviewedHighRiskEvents]
  ];

  return (
    <Grid className="gap-[var(--space-4)]">
      <Grid className="grid-cols-2 gap-[var(--space-2)] md:grid-cols-3">
        {metrics.map(([label, value]) => (
          <Box
            key={label}
            className="border-default bg-surface rounded-[var(--radius-md)] border p-[var(--space-3)]"
          >
            <Typography as="p" variant="caption" color="muted">
              {label}
            </Typography>
            <Typography as="p" variant="headingMd" className="pt-[var(--space-1)]">
              {value}
            </Typography>
          </Box>
        ))}
      </Grid>
      <Box>
        <Typography as="p" variant="bodySm" className="pb-[var(--space-2)] font-semibold">
          {t("recentSecurityEvents")}
        </Typography>
        {summary.recentEvents.length === 0 ? (
          <Typography as="p" variant="bodySm" color="muted">
            {t("noRecentSecurityEvents")}
          </Typography>
        ) : (
          <Grid className="gap-[var(--space-2)]">
            {summary.recentEvents.map((event) => (
              <Box
                key={event.id}
                className="border-default flex items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-md)] border p-[var(--space-3)]"
              >
                <Box className="min-w-0">
                  <Typography as="p" variant="bodySm" className="truncate">
                    {event.summary}
                  </Typography>
                  <Typography as="p" variant="caption" color="muted">
                    {event.actor} · {event.action}
                  </Typography>
                </Box>
                <Box className="flex shrink-0 items-center gap-[var(--space-2)]">
                  <Badge variant={AUDIT_SEVERITY_TONE[event.severity] ?? "secondary"} size="sm">
                    {event.severity}
                  </Badge>
                  <Typography as="span" variant="caption" color="subtle">
                    {formatAuditListDateTime(event.createdAt)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Grid>
        )}
      </Box>
    </Grid>
  );
}
