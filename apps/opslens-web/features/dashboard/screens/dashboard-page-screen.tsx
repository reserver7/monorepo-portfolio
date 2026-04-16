"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3, Rocket, ShieldAlert, Waves } from "lucide-react";
import {
  Box,
  Badge,
  Button,
  Flex,
  Grid,
  SplitWorkspaceLayout,
  StatCard,
  StateView,
  Typography,
  cn
} from "@repo/ui";
import { useQuery } from "@repo/react-query";
import {
  getDashboardSummary,
  opslensQueryKeys,
  toOptionalSearch,
  toOptionalServiceName
} from "@repo/opslens";
import { OpsDashboardSkeleton, OpsPageShell, OpsSectionCard, SeverityBadge } from "@/features";
import { useOpsFilters } from "@/features/stores";
import { formatNumber } from "@repo/utils";

const SeverityDistributionChart = dynamic(
  () => import("@/features/components/dashboard-charts").then((mod) => mod.SeverityDistributionChart),
  { ssr: false }
);
const ErrorTrendChart = dynamic(
  () => import("@/features/components/dashboard-charts").then((mod) => mod.ErrorTrendChart),
  { ssr: false }
);
const TopRepeatedErrorsChart = dynamic(
  () => import("@/features/components/dashboard-charts").then((mod) => mod.TopRepeatedErrorsChart),
  { ssr: false }
);

export default function DashboardPage() {
  const { environment, serviceName, search, from, to } = useOpsFilters();
  const filter = { environment, serviceName, search, from, to };

  const summaryQuery = useQuery({
    queryKey: opslensQueryKeys.dashboard(filter),
    staleTime: 10 * 1000,
    queryFn: () =>
      getDashboardSummary({
        environment,
        serviceName: toOptionalServiceName(serviceName),
        query: toOptionalSearch(search),
        from,
        to
      })
  });

  if (summaryQuery.isLoading) return <OpsDashboardSkeleton />;
  if (summaryQuery.isError || !summaryQuery.data) {
    return <StateView variant="error" size="lg" title="대시보드 조회에 실패했습니다." />;
  }

  const summary = summaryQuery.data;
  const criticalCount = summary.severityDistribution.find((item) => item.severity === "critical")?.count ?? 0;
  const highCount = summary.severityDistribution.find((item) => item.severity === "high")?.count ?? 0;
  const total24h = summary.errorTrend24h.reduce((acc, item) => acc + item.count, 0);
  const peak = summary.errorTrend24h.reduce(
    (best, curr) => (curr.count > best.count ? curr : best),
    summary.errorTrend24h[0] ?? { hour: "-", count: 0 }
  );
  const topIssue = summary.topRepeatedErrors[0];

  const responseQueue = summary.newAfterLatestDeployment.length > 0
    ? summary.newAfterLatestDeployment
    : summary.topRepeatedErrors.map((item) => ({
        issueId: item.issueId,
        title: item.title,
        severity: item.severity,
        count: item.count
      }));

  return (
    <OpsPageShell>
      <OpsSectionCard
        title="Operations Command Center"
        description="현재 운영 상태를 실시간으로 요약하고, 우선 대응 대상을 빠르게 정렬합니다."
      >
        <Flex className="flex-wrap items-center justify-between gap-3">
          <Flex className="flex-wrap items-center gap-2">
            <Badge variant="outline" size="sm">환경 {environment}</Badge>
            <Badge variant="outline" size="sm">서비스 {serviceName}</Badge>
            {search ? <Badge variant="outline" size="sm">검색 {search}</Badge> : null}
          </Flex>
          <Flex className="flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="primary" className="rounded-xl">
              <Link href="/issues" className="inline-flex items-center gap-1.5">
                이슈 대응
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link href="/logs">로그 분석</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link href="/deployments">배포 영향</Link>
            </Button>
          </Flex>
        </Flex>
      </OpsSectionCard>

      <Grid className="gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="오늘 발생 이슈"
          value={formatNumber(summary.todayIssueCount)}
          helper={topIssue ? `최다 반복: ${topIssue.title}` : "반복 이슈 없음"}
          size="lg"
        />
        <StatCard
          label="Critical / High"
          value={`${formatNumber(criticalCount)} / ${formatNumber(highCount)}`}
          helper={criticalCount > 0 ? "긴급 대응 필요" : "핵심 경보 안정"}
          color="danger"
          size="lg"
        />
        <StatCard
          label="24시간 총 에러 이벤트"
          value={formatNumber(total24h)}
          helper={`피크 ${peak.hour} (${formatNumber(peak.count)})`}
          color="warning"
          size="lg"
        />
        <StatCard
          label="배포 후 신규"
          value={formatNumber(summary.newAfterLatestDeployment.length)}
          helper={summary.newAfterLatestDeployment.length > 0 ? "릴리즈 확인 필요" : "신규 리스크 없음"}
          color="primary"
          size="lg"
        />
      </Grid>

      <SplitWorkspaceLayout
        sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_360px]"
        main={
          <Box className="space-y-6">
            <Grid className="gap-6 xl:grid-cols-3">
              <OpsSectionCard title="최근 24시간 에러 추이" className="xl:col-span-2" contentClassName="pt-4">
                <ErrorTrendChart summary={summary} />
              </OpsSectionCard>
              <OpsSectionCard title="심각도 분포" contentClassName="pt-4">
                <SeverityDistributionChart summary={summary} />
              </OpsSectionCard>
            </Grid>

            <Grid className="gap-6 xl:grid-cols-3">
              <OpsSectionCard title="반복 에러 TOP 5" className="xl:col-span-2" contentClassName="pt-4">
                <TopRepeatedErrorsChart summary={summary} />
              </OpsSectionCard>

              <OpsSectionCard title="운영 상태 스냅샷" description="현재 위험도와 이상 징후를 요약합니다.">
                <Box className="space-y-2.5">
                  <SnapshotRow icon={ShieldAlert} label="긴급 경보" value={`${formatNumber(criticalCount)}건`} tone={criticalCount > 0 ? "danger" : "neutral"} />
                  <SnapshotRow icon={AlertTriangle} label="고심각도" value={`${formatNumber(highCount)}건`} tone={highCount > 0 ? "warning" : "neutral"} />
                  <SnapshotRow icon={Clock3} label="에러 피크 시간" value={peak.hour} tone="info" />
                  <SnapshotRow icon={Waves} label="24시간 총 이벤트" value={formatNumber(total24h)} tone="info" />
                </Box>
              </OpsSectionCard>
            </Grid>

            <OpsSectionCard title="AI 브리핑" description="회의/공유에 바로 사용할 수 있는 운영 요약입니다.">
              <Box as="p" className="text-muted whitespace-pre-wrap text-sm leading-6">{summary.aiBriefing}</Box>
            </OpsSectionCard>
          </Box>
        }
        sidebar={
          <Box className="space-y-6">
            <OpsSectionCard title="우선 대응 큐" description="운영 담당자가 바로 처리할 순서입니다.">
              {responseQueue.length === 0 ? (
                <StateView variant="empty" size="sm" title="현재 대응할 항목이 없습니다." />
              ) : (
                <ul className="space-y-2.5">
                  {responseQueue.slice(0, 6).map((item, index) => (
                    <li key={item.issueId} className="border-default bg-surface-elevated rounded-xl border p-3">
                      <Flex className="mb-1 items-center justify-between gap-2">
                        <Typography as="p" variant="caption" color="subtle" className="font-semibold">
                          Queue {index + 1}
                        </Typography>
                        <SeverityBadge severity={item.severity} />
                      </Flex>
                      <Box as="p" className="text-foreground line-clamp-2 text-sm font-semibold">{item.title}</Box>
                      <Flex className="mt-2 items-center justify-between gap-2">
                        <Box as="p" className="text-muted text-caption">발생 {formatNumber(item.count)}회</Box>
                        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-caption">
                          <Link href="/issues">열기</Link>
                        </Button>
                      </Flex>
                    </li>
                  ))}
                </ul>
              )}
            </OpsSectionCard>

            <OpsSectionCard title="릴리즈 체크" description="배포 영향 분석을 빠르게 확인하세요.">
              <Button asChild variant="outline" className="w-full justify-between rounded-xl">
                <Link href="/deployments" className="inline-flex items-center gap-2">
                  <Box as="span" className="inline-flex items-center gap-2">
                    <Rocket className="h-4 w-4" /> 배포 영향 분석 이동
                  </Box>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </OpsSectionCard>
          </Box>
        }
      />
    </OpsPageShell>
  );
}

function SnapshotRow({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "danger" | "warning" | "info" | "neutral";
}) {
  return (
    <Flex className="border-default bg-surface-elevated items-center justify-between rounded-xl border px-3 py-2.5">
      <Flex className="items-center gap-2">
        <Box as="span"
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-lg",
            tone === "danger" && "bg-danger/12 text-danger",
            tone === "warning" && "bg-warning/12 text-warning",
            tone === "info" && "bg-primary/12 text-primary",
            tone === "neutral" && "bg-muted/40 text-muted"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </Box>
        <Typography as="p" variant="bodySm" className="font-medium">
          {label}
        </Typography>
      </Flex>
      <Typography as="p" variant="bodySm" className="font-semibold">
        {value}
      </Typography>
    </Flex>
  );
}
