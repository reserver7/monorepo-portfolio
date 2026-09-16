"use client";

import { FeedbackState } from "@/features/common/components/feedback-state";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { Badge, Box, Flex, Grid, Typography } from "@repo/ui";
import { formatDateTime, formatNumber } from "@repo/utils";
import { OpsInfoItem, OpsSectionSkeleton, SeverityBadge } from "@/features";
import type { DeploymentImpact } from "../types";
import { getDeploymentRiskVariant } from "../utils/deployment-utils";

type DeploymentImpactPanelProps = {
  impact?: DeploymentImpact;
  isError: boolean;
  isLoading: boolean;
  selectedVersion?: string;
};

export function DeploymentImpactPanel({
  impact,
  isError,
  isLoading,
  selectedVersion
}: DeploymentImpactPanelProps) {
  const t = useTranslations("deployments");
  const locale = useLocale();
  const riskLabels = {
    normal: t("risk.normal"),
    caution: t("risk.caution"),
    rollback_review: t("risk.rollbackReview")
  } as const;
  if (!selectedVersion) {
    return (
      <FeedbackState
        variant="info"
        size="sm"
        title={t("impact.selectVersion")}
        className="mt-[var(--space-3)]"
      />
    );
  }

  if (isLoading) {
    return (
      <OpsSectionSkeleton
        rows={5}
        className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-4)]"
      />
    );
  }

  if (isError || !impact) {
    return (
      <FeedbackState
        variant="error"
        size="sm"
        title={t("impact.loadFailed")}
        className="mt-[var(--space-3)]"
      />
    );
  }

  const hasIncreasedIssues = impact.increasedIssues.length > 0;

  return (
    <Box className="mt-[var(--space-3)] space-y-[var(--space-3)]">
      <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Flex className="items-start justify-between gap-[var(--space-3)]">
          <Box className="min-w-0">
            <Typography as="p" variant="bodySm" className="font-semibold">
              {t("impact.riskTitle")}
            </Typography>
            <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)] leading-[1.5]">
              {impact.recommendedAction}
            </Typography>
          </Box>
          <Badge
            variant={getDeploymentRiskVariant(impact.riskLevel)}
            size="sm"
            shape="rounded"
            className="shrink-0 font-semibold"
          >
            {riskLabels[impact.riskLevel as keyof typeof riskLabels] ?? impact.riskLevel}
          </Badge>
        </Flex>
      </Box>

      <Grid className="gap-[var(--space-3)] md:grid-cols-2">
        <OpsInfoItem label={t("impact.version")} value={impact.version} />
        <OpsInfoItem label={t("impact.deployedAt")} value={formatDateTime(impact.deployedAt, locale)} />
        <OpsInfoItem
          label={t("impact.monitoringWindow")}
          value={t("minutes", { count: formatNumber(impact.monitoringWindowMin, locale) })}
        />
        <OpsInfoItem
          label={t("impact.increasedIssues")}
          value={t("count", { count: formatNumber(impact.increasedIssueCount, locale) })}
        />
        <OpsInfoItem
          label={t("impact.afterErrors")}
          value={t("count", { count: formatNumber(impact.totalAfterErrorCount, locale) })}
        />
      </Grid>

      <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Flex className="items-start gap-[var(--space-2)]">
          <BarChart3 className="text-muted mt-[2px] h-4 w-4 shrink-0" />
          <Typography as="p" variant="bodySm" color="muted" className="leading-[1.6]">
            {impact.summary}
          </Typography>
        </Flex>
      </Box>

      {hasIncreasedIssues ? (
        <Box className="space-y-[var(--space-2)]">
          <Flex className="items-center justify-between gap-[var(--space-2)]">
            <Typography as="p" variant="bodySm" className="font-semibold">
              {t("impact.increasedIssues")}
            </Typography>
            <Badge variant="warning" size="sm" shape="rounded" className="font-semibold">
              {t("count", { count: formatNumber(impact.increasedIssues.length, locale) })}
            </Badge>
          </Flex>

          {impact.increasedIssues.map((item) => (
            <Link
              key={item.issueId}
              href={`/issues/${item.issueId}`}
              className="border-default hover:border-primary/50 block rounded-[var(--radius-md)] border p-[var(--space-3)] transition-colors"
            >
              <Flex className="items-start justify-between gap-[var(--space-3)]">
                <Box className="min-w-0">
                  <Typography as="p" variant="bodySm" className="line-clamp-2 font-semibold">
                    {item.title}
                  </Typography>
                  <Flex className="mt-[var(--space-2)] flex-wrap items-center gap-[var(--space-2)]">
                    <SeverityBadge severity={item.severity} />
                    <Typography as="span" variant="caption" color="muted">
                      {item.serviceName}
                    </Typography>
                  </Flex>
                </Box>
                <Box className="shrink-0 text-right">
                  <Typography as="p" variant="bodySm" className="font-semibold">
                    +{formatNumber(item.delta, locale)}
                  </Typography>
                  <Typography as="p" variant="caption" color="subtle">
                    {formatNumber(item.beforeCount, locale)} {"->"} {formatNumber(item.afterCount, locale)}
                  </Typography>
                </Box>
              </Flex>
              <Box
                className="mt-[var(--space-3)] space-y-[var(--space-1)]"
                aria-label={t("impact.comparisonAria", { title: item.title })}
              >
                <Box className="bg-muted/30 h-1.5 overflow-hidden rounded-full">
                  <Box
                    className="bg-muted h-full"
                    style={{
                      width: `${Math.max(8, (item.beforeCount / Math.max(item.beforeCount, item.afterCount, 1)) * 100)}%`
                    }}
                  />
                </Box>
                <Box className="bg-muted/30 h-1.5 overflow-hidden rounded-full">
                  <Box
                    className="bg-warning h-full"
                    style={{
                      width: `${Math.max(8, (item.afterCount / Math.max(item.beforeCount, item.afterCount, 1)) * 100)}%`
                    }}
                  />
                </Box>
                <Flex className="justify-between">
                  <Typography as="span" variant="caption" color="subtle">
                    {t("impact.before", { count: formatNumber(item.beforeCount, locale) })}
                  </Typography>
                  <Typography as="span" variant="caption" color="subtle">
                    {t("impact.after", { count: formatNumber(item.afterCount, locale) })}
                  </Typography>
                </Flex>
              </Box>
            </Link>
          ))}
        </Box>
      ) : (
        <Box className="border-default rounded-[var(--radius-md)] border border-dashed p-[var(--space-4)]">
          <Flex className="items-center gap-[var(--space-2)]">
            <AlertTriangle className="text-muted h-4 w-4" />
            <Typography as="p" variant="bodySm" color="muted">
              {t("impact.noIncreasedIssues")}
            </Typography>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
