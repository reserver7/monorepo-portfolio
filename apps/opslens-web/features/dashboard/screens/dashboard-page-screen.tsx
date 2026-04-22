"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Box,
  Badge,
  Flex,
  Grid,
  SplitWorkspaceLayout,
  StatCard,
  StateView,
  Typography
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
import { toCalendarLocale } from "@/lib/i18n/messages";

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
  const tDashboard = useTranslations("dashboard");
  const tLocale = useTranslations("locale");
  const tService = useTranslations("service");
  const router = useRouter();
  const { environment, locale, serviceName, search, from, to } = useOpsFilters();
  const filter = { environment, locale, serviceName, search, from, to };

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
  const topIssue = summary.topRepeatedErrors[0];

  const responseQueue = summary.newAfterLatestDeployment.length > 0
    ? summary.newAfterLatestDeployment
    : summary.topRepeatedErrors.map((item) => ({
        issueId: item.issueId,
        title: item.title,
        severity: item.severity,
        count: item.count
      }));
  const localeLabel = tLocale(locale);
  const serviceLabel = serviceName === "all"
    ? tService("all")
    : serviceName === "docs"
      ? tService("docs")
      : serviceName === "whiteboard"
        ? tService("whiteboard")
        : serviceName === "billing"
          ? tService("billing")
          : serviceName === "checkout"
            ? tService("checkout")
            : serviceName;
  const dateLocale = toCalendarLocale(locale);
  const formatDateByLocale = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat(dateLocale, { year: "numeric", month: "short", day: "numeric" }).format(date);
  };
  const rangeLabel = from || to ? `${formatDateByLocale(from)} ~ ${formatDateByLocale(to)}` : undefined;

  return (
    <OpsPageShell>
      <Flex className="items-center justify-between gap-[var(--space-3)]">
        <Typography as="h2" variant="headingMd">{tDashboard("title")}</Typography>
        <Flex className="flex-wrap items-center gap-[var(--space-2)]">
          <Badge variant="outline" size="sm">{tDashboard("badgeService")}: {serviceLabel}</Badge>
          <Badge variant="outline" size="sm">{tDashboard("badgeLanguage")}: {localeLabel}</Badge>
          {rangeLabel ? <Badge variant="outline" size="sm">{tDashboard("badgePeriod")}: {rangeLabel}</Badge> : null}
          {search ? <Badge variant="outline" size="sm">{tDashboard("badgeSearch")}: {search}</Badge> : null}
        </Flex>
      </Flex>

      <Grid className="justify-items-stretch gap-[var(--space-4)] md:grid-cols-2 xl:grid-cols-4">
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
          helper="최근 24시간 누적"
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
          <Box className="space-y-[var(--stack-gap)]">
            <Grid className="justify-items-stretch gap-[var(--space-6)] xl:grid-cols-12">
              <OpsSectionCard title="시간대별 에러 패턴" className="xl:col-span-8" contentClassName="pt-[var(--space-4)]">
                <ErrorTrendChart summary={summary} />
              </OpsSectionCard>
              <OpsSectionCard title="심각도 분포" className="xl:col-span-4" contentClassName="pt-[var(--space-4)]">
                <SeverityDistributionChart summary={summary} />
              </OpsSectionCard>
            </Grid>

            <Grid className="justify-items-stretch gap-[var(--space-6)] xl:grid-cols-12">
              <OpsSectionCard title="반복 에러 TOP 5" className="xl:col-span-7" contentClassName="pt-[var(--space-4)]">
                <TopRepeatedErrorsChart summary={summary} />
              </OpsSectionCard>
              <OpsSectionCard title="최근 배포 영향" className="xl:col-span-5">
                {summary.newAfterLatestDeployment.length === 0 ? (
                  <StateView variant="empty" size="sm" title="배포 이후 신규 이슈가 없습니다." />
                ) : (
                  <Box className="space-y-[var(--space-2)]">
                    {summary.newAfterLatestDeployment.slice(0, 5).map((item) => (
                      <Flex
                        key={item.issueId}
                        className="border-default bg-surface-elevated rounded-xl border px-[var(--space-3)] py-[var(--space-2-5)]"
                      >
                        <Flex className="min-w-0 flex-1 items-center justify-between gap-[var(--space-2)]">
                          <Typography as="p" variant="bodySm" className="truncate font-medium">
                            {item.title}
                          </Typography>
                          <SeverityBadge severity={item.severity} />
                        </Flex>
                      </Flex>
                    ))}
                  </Box>
                )}
              </OpsSectionCard>
            </Grid>
          </Box>
        }
        sidebar={
          <Box className="space-y-[var(--stack-gap)]">
            <OpsSectionCard title="우선 대응 큐" description="즉시 확인이 필요한 순서입니다.">
              {responseQueue.length === 0 ? (
                <StateView variant="empty" size="sm" title="현재 대응할 항목이 없습니다." />
              ) : (
                <Box className="space-y-[var(--space-2-5)]">
                  {responseQueue.slice(0, 6).map((item, index) => (
                    <Box
                      key={item.issueId}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push("/issues")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push("/issues");
                        }
                      }}
                      className="border-default bg-surface-elevated hover:border-primary/40 cursor-pointer rounded-xl border p-[var(--space-3)] transition-colors"
                    >
                      <Flex className="mb-[var(--space-1)] items-center justify-between gap-[var(--space-2)]">
                        <Typography as="p" variant="caption" color="subtle" className="font-semibold">
                          Queue {index + 1}
                        </Typography>
                        <SeverityBadge severity={item.severity} />
                      </Flex>
                      <Box as="p" className="text-foreground line-clamp-2 text-sm font-semibold">
                        {item.title}
                      </Box>
                      <Flex className="text-muted mt-[var(--space-2)] items-center justify-between gap-[var(--space-2)] text-caption">
                        <Box as="p" className="text-muted text-caption">발생 {formatNumber(item.count)}회</Box>
                        <Typography as="p" variant="caption" className="font-medium">상세 보기</Typography>
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
