"use client";

import { AlertTriangle, BarChart3 } from "lucide-react";
import { Badge, Box, Flex, Grid, StateView, Typography } from "@repo/ui";
import { formatDateTime, formatNumber } from "@repo/utils";
import { OpsInfoItem, SeverityBadge } from "@/features";
import type { DeploymentImpact } from "../types";
import { getDeploymentRiskLabel, getDeploymentRiskVariant } from "../utils/deployment-utils";

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
  if (!selectedVersion) {
    return <StateView variant="info" size="sm" title="분석할 배포 버전을 선택해 주세요." className="mt-[var(--space-3)]" />;
  }

  if (isLoading) {
    return (
      <StateView
        variant="loading"
        size="sm"
        className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-4)]"
        title="선택한 배포 버전 기준으로 영향도를 계산하는 중입니다."
      />
    );
  }

  if (isError || !impact) {
    return <StateView variant="error" size="sm" title="영향 분석에 실패했습니다." className="mt-[var(--space-3)]" />;
  }

  const hasIncreasedIssues = impact.increasedIssues.length > 0;

  return (
    <Box className="mt-[var(--space-3)] space-y-[var(--space-3)]">
      <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Flex className="items-start justify-between gap-[var(--space-3)]">
          <Box className="min-w-0">
            <Typography as="p" variant="bodySm" className="font-semibold">
              배포 위험 판단
            </Typography>
            <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)] leading-[1.5]">
              {impact.recommendedAction}
            </Typography>
          </Box>
          <Badge variant={getDeploymentRiskVariant(impact.riskLevel)} size="sm" shape="rounded" className="shrink-0 font-semibold">
            {getDeploymentRiskLabel(impact.riskLevel)}
          </Badge>
        </Flex>
      </Box>

      <Grid className="gap-[var(--space-3)] md:grid-cols-2">
        <OpsInfoItem label="배포 버전" value={impact.version} />
        <OpsInfoItem label="배포 시각" value={formatDateTime(impact.deployedAt)} />
        <OpsInfoItem label="모니터링 윈도우" value={`${formatNumber(impact.monitoringWindowMin)}분`} />
        <OpsInfoItem label="증가 이슈 수" value={`${formatNumber(impact.increasedIssueCount)}건`} />
        <OpsInfoItem label="배포 후 에러 이벤트" value={`${formatNumber(impact.totalAfterErrorCount)}건`} />
      </Grid>

      <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Flex className="items-start gap-[var(--space-2)]">
          <BarChart3 className="mt-[2px] h-4 w-4 shrink-0 text-muted" />
          <Typography as="p" variant="bodySm" color="muted" className="leading-[1.6]">
            {impact.summary}
          </Typography>
        </Flex>
      </Box>

      {hasIncreasedIssues ? (
        <Box className="space-y-[var(--space-2)]">
          <Flex className="items-center justify-between gap-[var(--space-2)]">
            <Typography as="p" variant="bodySm" className="font-semibold">
              증가 이슈
            </Typography>
            <Badge variant="warning" size="sm" shape="rounded" className="font-semibold">
              {formatNumber(impact.increasedIssues.length)}건
            </Badge>
          </Flex>

          {impact.increasedIssues.map((item) => (
            <Box key={item.issueId} className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
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
                    +{formatNumber(item.delta)}
                  </Typography>
                  <Typography as="p" variant="caption" color="subtle">
                    {formatNumber(item.beforeCount)} {"->"} {formatNumber(item.afterCount)}
                  </Typography>
                </Box>
              </Flex>
            </Box>
          ))}
        </Box>
      ) : (
        <Box className="border-default rounded-[var(--radius-md)] border border-dashed p-[var(--space-4)]">
          <Flex className="items-center gap-[var(--space-2)]">
            <AlertTriangle className="h-4 w-4 text-muted" />
            <Typography as="p" variant="bodySm" color="muted">
              배포 이후 증가한 이슈가 없습니다.
            </Typography>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
