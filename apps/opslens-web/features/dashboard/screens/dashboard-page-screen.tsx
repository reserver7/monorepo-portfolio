"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Box,
  Badge,
  Button,
  Flex,
  Grid,
  SplitWorkspaceLayout,
  StatCard,
  StateView,
  Skeleton,
  Typography
} from "@repo/ui";
import { useQuery } from "@repo/react-query";
import {
  getDashboardSummary,
  getServiceHealth,
  opslensQueryKeys,
  toOptionalSearch,
  toOptionalServiceName
} from "@repo/opslens";
import { OpsDashboardSkeleton, OpsPageShell, OpsSectionCard, OpsSectionSkeleton, SeverityBadge } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsFilters } from "@/features/common/stores";
import { useOpsFilterStore } from "@/features/common/stores";
import { formatDateRangeLabel, formatDateTimeByLocale, resolveServiceLabel } from "@/features/common/utils/ops-display";
import { formatNumber } from "@repo/utils";
import { DASHBOARD_ISSUE_KEY_TO_I18N_MAP } from "../constants";
import { readAuthSession } from "@/lib/auth";

function OpsChartSkeleton({ heightClassName }: { heightClassName: string }) {
  return (
    <Box className={`w-full ${heightClassName} space-y-[var(--space-2)]`}>
      <Skeleton className="h-4 w-1/3 rounded-[var(--radius-md)]" />
      <Skeleton className="h-[calc(100%-1.5rem)] w-full rounded-[var(--radius-lg)]" />
    </Box>
  );
}

const SeverityDistributionChart = dynamic(() => import("../components/dashboard-charts").then((mod) => mod.SeverityDistributionChart), {
  ssr: false,
  loading: () => <OpsChartSkeleton heightClassName="h-[232px]" />
});
const ErrorTrendChart = dynamic(() => import("../components/dashboard-charts").then((mod) => mod.ErrorTrendChart), {
  ssr: false,
  loading: () => <OpsChartSkeleton heightClassName="h-[232px]" />
});
const TopRepeatedErrorsChart = dynamic(() => import("../components/dashboard-charts").then((mod) => mod.TopRepeatedErrorsChart), {
  ssr: false,
  loading: () => <OpsChartSkeleton heightClassName="h-[248px]" />
});

export default function DashboardPage() {
  const tDashboard = useTranslations("dashboard");
  const tService = useTranslations("service");
  const router = useRouter();
  const role = readAuthSession()?.user.role ?? "viewer";
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    setShowOnboarding(window.localStorage.getItem("opslens.onboarding.dismissed") !== "1");
  }, []);
  const { environment, locale, serviceName, search, from, to } = useOpsFilters();
  const setServiceName = useOpsFilterStore((state) => state.setServiceName);
  const filter = { environment, locale, serviceName, search, from, to };
  const previousRange = useMemo(() => {
    if (!from || !to) return null;
    const start = new Date(from).getTime();
    const end = new Date(to).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
    const duration = end - start;
    return { from: new Date(start - duration).toISOString(), to: new Date(start).toISOString() };
  }, [from, to]);

  const summaryQuery = useQuery(useOpsQueryOptions("default", {
    queryKey: opslensQueryKeys.dashboard(filter),
    queryFn: () =>
      getDashboardSummary({
        environment,
        serviceName: toOptionalServiceName(serviceName),
        query: toOptionalSearch(search),
        from,
        to
      })
  }));
  const previousSummaryQuery = useQuery(useOpsQueryOptions("default", {
    queryKey: [...opslensQueryKeys.dashboard(filter), "previous", previousRange],
    enabled: Boolean(previousRange),
    queryFn: () => getDashboardSummary({
      environment,
      serviceName: toOptionalServiceName(serviceName),
      query: toOptionalSearch(search),
      from: previousRange?.from,
      to: previousRange?.to
    })
  }));
  const serviceHealthQuery = useQuery(useOpsQueryOptions("default", {
    queryKey: opslensQueryKeys.serviceHealth(filter),
    queryFn: () => getServiceHealth({ environment, serviceName: toOptionalServiceName(serviceName), query: toOptionalSearch(search) })
  }));

  if (summaryQuery.isLoading) return <OpsDashboardSkeleton />;
  if (summaryQuery.isError || !summaryQuery.data) {
    return <StateView variant="error" size="lg" title={tDashboard("errorLoadFailed")} />;
  }

  const summary = summaryQuery.data;
  const localizeIssueTitle = (title: string, titleKey?: string) => {
    if (!titleKey) return title;
    const i18nKey = DASHBOARD_ISSUE_KEY_TO_I18N_MAP[titleKey as keyof typeof DASHBOARD_ISSUE_KEY_TO_I18N_MAP];
    return i18nKey ? tDashboard(i18nKey) : title;
  };
  const topRepeatedErrors = summary.topRepeatedErrors.map((item) => ({
    ...item,
    title: localizeIssueTitle(item.title, item.titleKey)
  }));
  const newAfterLatestDeployment = summary.newAfterLatestDeployment.map((item) => ({
    ...item,
    title: localizeIssueTitle(item.title, item.titleKey)
  }));
  const localizedSummary = {
    ...summary,
    topRepeatedErrors,
    newAfterLatestDeployment
  };
  const criticalCount = summary.severityDistribution.find((item) => item.severity === "critical")?.count ?? 0;
  const highCount = summary.severityDistribution.find((item) => item.severity === "high")?.count ?? 0;
  const total24h = summary.errorTrend24h.reduce((acc, item) => acc + item.count, 0);
  const previousTotal = previousSummaryQuery.data?.errorTrend24h.reduce((acc, item) => acc + item.count, 0) ?? null;
  const totalDelta = previousTotal === null ? null : total24h - previousTotal;
  const topIssue = topRepeatedErrors[0];

  const responseQueue = newAfterLatestDeployment.length > 0
    ? newAfterLatestDeployment
    : topRepeatedErrors.map((item) => ({
        issueId: item.issueId,
        title: item.title,
        severity: item.severity,
        count: item.count
      }));
  const serviceLabel = resolveServiceLabel(serviceName, tService);
  const rangeLabel = formatDateRangeLabel(from, to, locale);
  const lastUpdatedLabel = formatDateTimeByLocale(new Date(summaryQuery.dataUpdatedAt).toISOString(), locale);

  return (
    <OpsPageShell>
      <Box className="border-default bg-surface rounded-[var(--radius-xl)] border px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-5)]">
        <Flex className="items-center justify-between gap-[var(--space-3)]">
          <Typography as="h2" variant="headingMd" className="tracking-[-0.01em]">{tDashboard("title")}</Typography>
          <Flex className="flex-wrap items-center gap-[var(--space-2)]">
            <Typography as="p" variant="caption" color="subtle" className="mr-[var(--space-1)]">
              {tDashboard("lastUpdated")}: {lastUpdatedLabel}
            </Typography>
            <Badge variant="secondary" size="sm">{tDashboard("badgeService")}: {serviceLabel}</Badge>
            {rangeLabel ? <Badge variant="outline" size="sm">{tDashboard("badgePeriod")}: {rangeLabel}</Badge> : null}
            {previousRange ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => void previousSummaryQuery.refetch()} loading={previousSummaryQuery.isFetching}>
                이전 기간 비교
              </Button>
            ) : null}
          </Flex>
        </Flex>
      </Box>

      {showOnboarding ? <OpsSectionCard title="OpsLens 시작하기" description="처음 사용하는 운영자를 위한 짧은 안내입니다."><Grid className="gap-[var(--space-2)] md:grid-cols-3"><Typography as="p" variant="caption" color="muted">1. 상단 필터로 환경과 서비스를 선택합니다.</Typography><Typography as="p" variant="caption" color="muted">2. 커맨드 센터에서 즉시 대응 이슈를 확인합니다.</Typography><Typography as="p" variant="caption" color="muted">3. 로그 분석과 이슈 상세에서 대응을 이어갑니다.</Typography></Grid><Button type="button" variant="ghost" size="sm" className="mt-[var(--space-2)]" onClick={() => { window.localStorage.setItem("opslens.onboarding.dismissed", "1"); setShowOnboarding(false); }}>다시 보지 않기</Button></OpsSectionCard> : null}

      <OpsSectionCard title="내 운영 시작점" description={role === "admin" ? "연동·권한·알림 전달 상태를 먼저 점검하세요." : role === "operator" ? "내 대응 큐와 즉시 대응 인시던트를 먼저 확인하세요." : "현재 운영 상태와 공유 리포트를 확인하세요."}>
        <Flex className="flex-wrap gap-[var(--space-2)]">{(role === "admin" ? [{ label: "운영 설정", href: "/settings?tab=workspace" }, { label: "알림 전달", href: "/settings?tab=notifications" }, { label: "커맨드 센터", href: "/command-center" }] : role === "operator" ? [{ label: "내 대응 큐", href: "/issues?assignee=me" }, { label: "커맨드 센터", href: "/command-center" }, { label: "로그 분석", href: "/logs" }] : [{ label: "운영 리포트", href: "/reports" }, { label: "대시보드", href: "/" }]).map((item) => <Button key={item.href} type="button" variant="secondary" size="sm" onClick={() => router.push(item.href)}>{item.label}</Button>)}</Flex>
      </OpsSectionCard>

      <Grid className="justify-items-stretch gap-[var(--space-3)] md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={tDashboard("stats.todayIssues.label")}
          value={formatNumber(summary.todayIssueCount)}
          helper={topIssue ? tDashboard("stats.todayIssues.helperTopPrefix") : tDashboard("stats.todayIssues.helperNone")}
          className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:line-clamp-1 [&>p:last-child]:text-[11px]"
          size="md"
        />
        <StatCard
          label={tDashboard("stats.criticalHigh.label")}
          value={`${formatNumber(criticalCount)} / ${formatNumber(highCount)}`}
          helper={criticalCount > 0 ? tDashboard("stats.criticalHigh.helperAlert") : tDashboard("stats.criticalHigh.helperStable")}
          color="danger"
          className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:line-clamp-1 [&>p:last-child]:text-[11px]"
          size="md"
        />
        <StatCard
          label={tDashboard("stats.newAfterDeploy.label")}
          value={formatNumber(summary.newAfterLatestDeployment.length)}
          helper={summary.newAfterLatestDeployment.length > 0 ? tDashboard("stats.newAfterDeploy.helperHasRisk") : tDashboard("stats.newAfterDeploy.helperNoRisk")}
          color="warning"
          className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:line-clamp-1 [&>p:last-child]:text-[11px]"
          size="md"
        />
        <StatCard
          label={tDashboard("stats.total24h.label")}
          value={formatNumber(total24h)}
          helper={totalDelta === null ? tDashboard("stats.total24h.helper") : `이전 기간 대비 ${totalDelta > 0 ? "+" : ""}${formatNumber(totalDelta)}건`}
          color="primary"
          className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:line-clamp-1 [&>p:last-child]:text-[11px]"
          size="md"
        />
      </Grid>

      <OpsSectionCard title="서비스 상태" description="열린 이슈와 Critical/High 신호를 기준으로 서비스 상태를 정리합니다.">
        {serviceHealthQuery.isLoading ? (
          <OpsSectionSkeleton rows={4} />
        ) : serviceHealthQuery.data?.length ? (
          <Grid className="gap-[var(--space-3)] md:grid-cols-2 xl:grid-cols-4">
            {serviceHealthQuery.data.map((item) => (
              <Box key={item.serviceName} role="button" tabIndex={0} onClick={() => { setServiceName(item.serviceName); router.push("/issues"); }} onKeyDown={(event) => { if (event.key === "Enter") { setServiceName(item.serviceName); router.push("/issues"); } }} className="border-default bg-surface hover:border-primary/40 cursor-pointer rounded-[var(--radius-lg)] border p-[var(--space-3)]">
                <Flex className="items-center justify-between gap-[var(--space-2)]">
                  <Typography as="p" variant="bodySm" className="font-semibold">{resolveServiceLabel(item.serviceName, tService)}</Typography>
                  <Badge size="sm" variant={item.status === "incident" ? "danger" : item.status === "degraded" ? "warning" : "success"}>{item.status === "incident" ? "장애" : item.status === "degraded" ? "주의" : "정상"}</Badge>
                </Flex>
                <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-3)]">열린 이슈 {formatNumber(item.openIssueCount)} · Critical/High {formatNumber(item.criticalHighCount)}</Typography>
                <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-1)]">최근 이벤트 {item.lastOccurredAt ? formatDateTimeByLocale(item.lastOccurredAt, locale) : "없음"}</Typography>
              </Box>
            ))}
          </Grid>
        ) : (
          <StateView variant="empty" size="sm" title="현재 필터에 해당하는 서비스 이벤트가 없습니다." />
        )}
      </OpsSectionCard>

      <SplitWorkspaceLayout
        sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_372px]"
        main={
          <Box className="space-y-[var(--space-5)]">
            <Grid className="justify-items-stretch gap-[var(--space-5)] xl:grid-cols-12">
              <OpsSectionCard title={tDashboard("sections.errorPatternByHour")} className="xl:col-span-8" contentClassName="pt-[var(--space-2)]">
                <ErrorTrendChart summary={localizedSummary} />
              </OpsSectionCard>
              <OpsSectionCard title={tDashboard("sections.severityDistribution")} className="xl:col-span-4" contentClassName="pt-[var(--space-2)]">
                <SeverityDistributionChart summary={localizedSummary} />
              </OpsSectionCard>
            </Grid>

            <Grid className="justify-items-stretch gap-[var(--space-5)] xl:grid-cols-12">
              <OpsSectionCard title={tDashboard("sections.topRepeatedErrors")} className="xl:col-span-12" contentClassName="pt-[var(--space-2)]">
                <TopRepeatedErrorsChart summary={localizedSummary} />
              </OpsSectionCard>
            </Grid>
          </Box>
        }
        sidebar={
          <Box className="space-y-[var(--space-5)]">
            <OpsSectionCard title={tDashboard("sections.priorityQueue")} description={tDashboard("sections.priorityQueueDescription")}>
              {responseQueue.length === 0 ? (
                <StateView variant="empty" size="sm" title={tDashboard("empty.noQueue")} />
              ) : (
                <Box className="space-y-[var(--space-2)]">
                  {responseQueue.slice(0, 6).map((item, index) => (
                    <Box
                      key={item.issueId}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/issues/${item.issueId}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/issues/${item.issueId}`);
                        }
                      }}
                      className="border-default bg-surface hover:border-primary/40 hover:bg-surface-elevated cursor-pointer rounded-[var(--radius-lg)] border p-[var(--space-3)] transition-colors"
                    >
                      <Flex className="mb-[var(--space-1)] items-center justify-between gap-[var(--space-2)]">
                        <Typography as="p" variant="caption" color="subtle" className="font-semibold">
                          {tDashboard("queue.itemPrefix")} {index + 1}
                        </Typography>
                        <SeverityBadge severity={item.severity} />
                      </Flex>
                      <Box as="p" className="text-foreground line-clamp-2 text-sm font-semibold">
                        {item.title}
                      </Box>
                      <Flex className="text-muted mt-[var(--space-2)] items-center justify-between gap-[var(--space-2)] text-caption">
                        <Box as="p" className="text-muted text-caption">{tDashboard("queue.countPrefix")} {formatNumber(item.count)}{tDashboard("queue.countSuffix")}</Box>
                        <Typography as="p" variant="caption" className="font-medium">{tDashboard("queue.viewDetail")}</Typography>
                      </Flex>
                    </Box>
                  ))}
                </Box>
              )}
            </OpsSectionCard>
          </Box>
        }
      />
    </OpsPageShell>
  );
}
