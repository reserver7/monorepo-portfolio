"use client";

import { FeedbackState, MetricCard } from "@/features/common/components/feedback-state";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Box, Badge, Button, Flex, Grid, SplitWorkspaceLayout, Skeleton, Typography } from "@repo/ui";
import { useQuery } from "@repo/react-query";
import {
  getDashboardSummary,
  getServiceHealth,
  opslensQueryKeys,
  toOptionalSearch,
  toOptionalServiceName
} from "@repo/opslens";
import {
  OpsDashboardSkeleton,
  OpsPageShell,
  OpsSectionCard,
  OpsSectionSkeleton,
  SeverityBadge
} from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsFilters } from "@/features/common/stores";
import { useOpsFilterStore } from "@/features/common/stores";
import {
  formatDateRangeLabel,
  formatDateTimeByLocale,
  resolveServiceLabel
} from "@/features/common/utils/ops-display";
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

const SeverityDistributionChart = dynamic(
  () => import("../components/dashboard-charts").then((mod) => mod.SeverityDistributionChart),
  {
    ssr: false,
    loading: () => <OpsChartSkeleton heightClassName="h-[232px]" />
  }
);
const ErrorTrendChart = dynamic(
  () => import("../components/dashboard-charts").then((mod) => mod.ErrorTrendChart),
  {
    ssr: false,
    loading: () => <OpsChartSkeleton heightClassName="h-[232px]" />
  }
);
const TopRepeatedErrorsChart = dynamic(
  () => import("../components/dashboard-charts").then((mod) => mod.TopRepeatedErrorsChart),
  {
    ssr: false,
    loading: () => <OpsChartSkeleton heightClassName="h-[248px]" />
  }
);

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

  const summaryQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: opslensQueryKeys.dashboard(filter),
      queryFn: () =>
        getDashboardSummary({
          environment,
          serviceName: toOptionalServiceName(serviceName),
          query: toOptionalSearch(search),
          from,
          to
        })
    })
  );
  const previousSummaryQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: [...opslensQueryKeys.dashboard(filter), "previous", previousRange],
      enabled: Boolean(previousRange),
      queryFn: () =>
        getDashboardSummary({
          environment,
          serviceName: toOptionalServiceName(serviceName),
          query: toOptionalSearch(search),
          from: previousRange?.from,
          to: previousRange?.to
        })
    })
  );
  const serviceHealthQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: opslensQueryKeys.serviceHealth(filter),
      queryFn: () =>
        getServiceHealth({
          environment,
          serviceName: toOptionalServiceName(serviceName),
          query: toOptionalSearch(search)
        })
    })
  );

  if (summaryQuery.isLoading) return <OpsDashboardSkeleton />;
  if (summaryQuery.isError || !summaryQuery.data) {
    return <FeedbackState variant="error" size="lg" title={tDashboard("errorLoadFailed")} />;
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
  const previousTotal =
    previousSummaryQuery.data?.errorTrend24h.reduce((acc, item) => acc + item.count, 0) ?? null;
  const totalDelta = previousTotal === null ? null : total24h - previousTotal;
  const topIssue = topRepeatedErrors[0];

  const responseQueue =
    newAfterLatestDeployment.length > 0
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
          <Typography as="h2" variant="headingMd" className="tracking-[-0.01em]">
            {tDashboard("title")}
          </Typography>
          <Flex className="flex-wrap items-center gap-[var(--space-2)]">
            <Typography as="p" variant="caption" color="subtle" className="mr-[var(--space-1)]">
              {tDashboard("lastUpdated")}: {lastUpdatedLabel}
            </Typography>
            <Badge variant="secondary" size="sm">
              {tDashboard("badgeService")}: {serviceLabel}
            </Badge>
            {rangeLabel ? (
              <Badge variant="outline" size="sm">
                {tDashboard("badgePeriod")}: {rangeLabel}
              </Badge>
            ) : null}
            {previousRange ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void previousSummaryQuery.refetch()}
                loading={previousSummaryQuery.isFetching}
              >
                {tDashboard("previousPeriodCompare")}
              </Button>
            ) : null}
          </Flex>
        </Flex>
      </Box>

      {showOnboarding ? (
        <OpsSectionCard
          title={tDashboard("onboarding.title")}
          description={tDashboard("onboarding.description")}
        >
          <Grid className="gap-[var(--space-2)] md:grid-cols-3">
            <Typography as="p" variant="caption" color="muted">
              {tDashboard("onboarding.step1")}
            </Typography>
            <Typography as="p" variant="caption" color="muted">
              {tDashboard("onboarding.step2")}
            </Typography>
            <Typography as="p" variant="caption" color="muted">
              {tDashboard("onboarding.step3")}
            </Typography>
          </Grid>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-[var(--space-2)]"
            onClick={() => {
              window.localStorage.setItem("opslens.onboarding.dismissed", "1");
              setShowOnboarding(false);
            }}
          >
            {tDashboard("onboarding.dismiss")}
          </Button>
        </OpsSectionCard>
      ) : null}

      <OpsSectionCard
        title={tDashboard("startingPoint.title")}
        description={
          role === "admin"
            ? tDashboard("startingPoint.adminDescription")
            : role === "operator"
              ? tDashboard("startingPoint.operatorDescription")
              : tDashboard("startingPoint.viewerDescription")
        }
      >
        <Flex className="flex-wrap gap-[var(--space-2)]">
          {(role === "admin"
            ? [
                { label: tDashboard("quickLinks.workspace"), href: "/settings?tab=workspace" },
                { label: tDashboard("quickLinks.notifications"), href: "/settings?tab=notifications" },
                { label: tDashboard("quickLinks.commandCenter"), href: "/command-center" }
              ]
            : role === "operator"
              ? [
                  { label: tDashboard("quickLinks.myQueue"), href: "/issues?assignee=me" },
                  { label: tDashboard("quickLinks.commandCenter"), href: "/command-center" },
                  { label: tDashboard("quickLinks.logAnalysis"), href: "/logs" }
                ]
              : [
                  { label: tDashboard("quickLinks.reports"), href: "/reports" },
                  { label: tDashboard("quickLinks.dashboard"), href: "/" }
                ]
          ).map((item) => (
            <Button
              key={item.href}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push(item.href)}
            >
              {item.label}
            </Button>
          ))}
        </Flex>
      </OpsSectionCard>

      <Grid className="justify-items-stretch gap-[var(--space-3)] md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={tDashboard("stats.todayIssues.label")}
          value={formatNumber(summary.todayIssueCount, locale)}
          helper={
            topIssue
              ? tDashboard("stats.todayIssues.helperTopPrefix")
              : tDashboard("stats.todayIssues.helperNone")
          }
          className="h-full rounded-[var(--radius-lg)] [&>p:last-child]:line-clamp-1 [&>p:last-child]:text-[11px] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1]"
          size="md"
        />
        <MetricCard
          label={tDashboard("stats.criticalHigh.label")}
          value={`${formatNumber(criticalCount, locale)} / ${formatNumber(highCount, locale)}`}
          helper={
            criticalCount > 0
              ? tDashboard("stats.criticalHigh.helperAlert")
              : tDashboard("stats.criticalHigh.helperStable")
          }
          color="danger"
          className="h-full rounded-[var(--radius-lg)] [&>p:last-child]:line-clamp-1 [&>p:last-child]:text-[11px] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1]"
          size="md"
        />
        <MetricCard
          label={tDashboard("stats.newAfterDeploy.label")}
          value={formatNumber(summary.newAfterLatestDeployment.length, locale)}
          helper={
            summary.newAfterLatestDeployment.length > 0
              ? tDashboard("stats.newAfterDeploy.helperHasRisk")
              : tDashboard("stats.newAfterDeploy.helperNoRisk")
          }
          color="warning"
          className="h-full rounded-[var(--radius-lg)] [&>p:last-child]:line-clamp-1 [&>p:last-child]:text-[11px] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1]"
          size="md"
        />
        <MetricCard
          label={tDashboard("stats.total24h.label")}
          value={formatNumber(total24h, locale)}
          helper={
            totalDelta === null
              ? tDashboard("stats.total24h.helper")
              : tDashboard("stats.total24h.helperDelta", {
                  delta: `${totalDelta > 0 ? "+" : ""}${formatNumber(totalDelta, locale)}`
                })
          }
          color="primary"
          className="h-full rounded-[var(--radius-lg)] [&>p:last-child]:line-clamp-1 [&>p:last-child]:text-[11px] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1]"
          size="md"
        />
      </Grid>

      <OpsSectionCard
        title={tDashboard("serviceHealth.title")}
        description={tDashboard("serviceHealth.description")}
      >
        {serviceHealthQuery.isLoading ? (
          <OpsSectionSkeleton rows={4} />
        ) : serviceHealthQuery.data?.length ? (
          <Grid className="gap-[var(--space-3)] md:grid-cols-2 xl:grid-cols-4">
            {serviceHealthQuery.data.map((item) => (
              <Link
                key={item.serviceName}
                href={`/services/${encodeURIComponent(item.serviceName)}`}
                onClick={() => setServiceName(item.serviceName)}
                className="border-default bg-surface hover:border-primary/40 block rounded-[var(--radius-lg)] border p-[var(--space-3)]"
              >
                <Flex className="items-center justify-between gap-[var(--space-2)]">
                  <Typography as="p" variant="bodySm" className="font-semibold">
                    {resolveServiceLabel(item.serviceName, tService)}
                  </Typography>
                  <Badge
                    size="sm"
                    variant={
                      item.status === "incident"
                        ? "danger"
                        : item.status === "degraded"
                          ? "warning"
                          : "success"
                    }
                  >
                    {item.status === "incident"
                      ? tDashboard("serviceHealth.statusIncident")
                      : item.status === "degraded"
                        ? tDashboard("serviceHealth.statusDegraded")
                        : tDashboard("serviceHealth.statusHealthy")}
                  </Badge>
                </Flex>
                <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-3)]">
                  {tDashboard("serviceHealth.openIssues", {
                    count: formatNumber(item.openIssueCount, locale)
                  })}{" "}
                  · Critical/High {formatNumber(item.criticalHighCount, locale)}
                </Typography>
                <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-1)]">
                  {tDashboard("serviceHealth.lastEvent")}{" "}
                  {item.lastOccurredAt
                    ? formatDateTimeByLocale(item.lastOccurredAt, locale)
                    : tDashboard("serviceHealth.none")}
                </Typography>
              </Link>
            ))}
          </Grid>
        ) : (
          <FeedbackState variant="empty" size="sm" title={tDashboard("serviceHealth.noFilteredEvents")} />
        )}
      </OpsSectionCard>

      <SplitWorkspaceLayout
        sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_372px]"
        main={
          <Box className="space-y-[var(--space-5)]">
            <Grid className="justify-items-stretch gap-[var(--space-5)] xl:grid-cols-12">
              <OpsSectionCard
                title={tDashboard("sections.errorPatternByHour")}
                className="xl:col-span-8"
                contentClassName="pt-[var(--space-2)]"
              >
                <ErrorTrendChart summary={localizedSummary} />
              </OpsSectionCard>
              <OpsSectionCard
                title={tDashboard("sections.severityDistribution")}
                className="xl:col-span-4"
                contentClassName="pt-[var(--space-2)]"
              >
                <SeverityDistributionChart summary={localizedSummary} />
              </OpsSectionCard>
            </Grid>

            <Grid className="justify-items-stretch gap-[var(--space-5)] xl:grid-cols-12">
              <OpsSectionCard
                title={tDashboard("sections.topRepeatedErrors")}
                className="xl:col-span-12"
                contentClassName="pt-[var(--space-2)]"
              >
                <TopRepeatedErrorsChart summary={localizedSummary} />
              </OpsSectionCard>
            </Grid>
          </Box>
        }
        sidebar={
          <Box className="space-y-[var(--space-5)]">
            <OpsSectionCard
              title={tDashboard("sections.priorityQueue")}
              description={tDashboard("sections.priorityQueueDescription")}
            >
              {responseQueue.length === 0 ? (
                <FeedbackState variant="empty" size="sm" title={tDashboard("empty.noQueue")} />
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
                      <Flex className="text-muted text-caption mt-[var(--space-2)] items-center justify-between gap-[var(--space-2)]">
                        <Box as="p" className="text-muted text-caption">
                          {tDashboard("queue.countPrefix")} {formatNumber(item.count, locale)}
                          {tDashboard("queue.countSuffix")}
                        </Box>
                        <Typography as="p" variant="caption" className="font-medium">
                          {tDashboard("queue.viewDetail")}
                        </Typography>
                      </Flex>
                    </Box>
                  ))}
                </Box>
              )}
              <Button asChild variant="outline" size="sm" className="mt-[var(--space-3)] w-full">
                <Link href="/command-center">{tDashboard("quickLinks.viewAllResponse")}</Link>
              </Button>
            </OpsSectionCard>
          </Box>
        }
      />
    </OpsPageShell>
  );
}
