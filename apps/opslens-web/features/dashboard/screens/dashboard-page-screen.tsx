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
  Skeleton,
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
import { formatDateRangeLabel, resolveServiceLabel } from "@/features/utils/ops-display";
import { useOpsFilters } from "@/features/stores";
import { useOpsQueryOptions } from "@/features/query/use-ops-query-options";
import { formatNumber } from "@repo/utils";
import { toCalendarLocale } from "@/lib/i18n/messages";

function OpsChartSkeleton({ heightClassName }: { heightClassName: string }) {
  return (
    <Box className={`w-full ${heightClassName} space-y-[var(--space-2)]`}>
      <Skeleton className="h-4 w-1/3 rounded-[var(--radius-md)]" />
      <Skeleton className="h-[calc(100%-1.5rem)] w-full rounded-[var(--radius-lg)]" />
    </Box>
  );
}

const SeverityDistributionChart = dynamic(() => import("@/features/components/dashboard-charts").then((mod) => mod.SeverityDistributionChart), {
  ssr: false,
  loading: () => <OpsChartSkeleton heightClassName="h-[232px]" />
});
const ErrorTrendChart = dynamic(() => import("@/features/components/dashboard-charts").then((mod) => mod.ErrorTrendChart), {
  ssr: false,
  loading: () => <OpsChartSkeleton heightClassName="h-[232px]" />
});
const TopRepeatedErrorsChart = dynamic(() => import("@/features/components/dashboard-charts").then((mod) => mod.TopRepeatedErrorsChart), {
  ssr: false,
  loading: () => <OpsChartSkeleton heightClassName="h-[248px]" />
});

const ISSUE_KEY_TO_I18N_MAP = {
  runtimeTypeError: "issueKeys.runtimeTypeError",
  apiHttp500: "issueKeys.apiHttp500",
  networkTimeout: "issueKeys.networkTimeout",
  loginSessionIssue: "issueKeys.loginSessionIssue",
  renderLatency: "issueKeys.renderLatency",
  qaRegression: "issueKeys.qaRegression",
  discountDisplayMissing: "issueKeys.discountDisplayMissing",
  docsPermissionLoop: "issueKeys.docsPermissionLoop",
  whiteboardReconnectDelay: "issueKeys.whiteboardReconnectDelay"
} as const;

export default function DashboardPage() {
  const tDashboard = useTranslations("dashboard");
  const tService = useTranslations("service");
  const router = useRouter();
  const { environment, locale, serviceName, search, from, to } = useOpsFilters();
  const filter = { environment, locale, serviceName, search, from, to };

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

  if (summaryQuery.isLoading) return <OpsDashboardSkeleton />;
  if (summaryQuery.isError || !summaryQuery.data) {
    return <StateView variant="error" size="lg" title={tDashboard("errorLoadFailed")} />;
  }

  const summary = summaryQuery.data;
  const localizeIssueTitle = (title: string, titleKey?: string) => {
    if (!titleKey) return title;
    const i18nKey = ISSUE_KEY_TO_I18N_MAP[titleKey as keyof typeof ISSUE_KEY_TO_I18N_MAP];
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
  const dateLocale = toCalendarLocale(locale);
  const rangeLabel = formatDateRangeLabel(from, to, locale);
  const lastUpdatedLabel = new Intl.DateTimeFormat(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(summaryQuery.dataUpdatedAt));

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
          </Flex>
        </Flex>
      </Box>

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
          helper={tDashboard("stats.total24h.helper")}
          color="primary"
          className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:line-clamp-1 [&>p:last-child]:text-[11px]"
          size="md"
        />
      </Grid>

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
