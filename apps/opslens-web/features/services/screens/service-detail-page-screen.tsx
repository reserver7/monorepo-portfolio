"use client";

import { FeedbackState, MetricCard } from "@/features/common/components/feedback-state";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Box, Button, Flex, Grid, Typography } from "@repo/ui";
import { useQuery } from "@repo/react-query";
import {
  getDeployments,
  getLogSourceFreshness,
  getOpsSettings,
  getServiceSlo,
  listIssues,
  opslensQueryKeys
} from "@repo/opslens";
import { OpsPageShell, OpsSectionCard, OpsSectionSkeleton, SeverityBadge } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsFilters } from "@/features/common/stores";
import { formatDateTime, formatNumber } from "@repo/utils";
import { parseServiceCatalog, type ServiceCatalog } from "@/features/common/utils/ops-display";

export default function ServiceDetailPage() {
  const t = useTranslations("services.detail");
  const locale = useLocale();
  const params = useParams<{ name: string }>();
  const serviceName = decodeURIComponent(params.name ?? "");
  const { environment } = useOpsFilters();
  const issueFilter = {
    environment,
    serviceName,
    search: "",
    status: "all" as const,
    severity: "all" as const,
    page: 1
  };
  const issuesQuery = useQuery(
    useOpsQueryOptions("list", {
      queryKey: opslensQueryKeys.issues(issueFilter),
      queryFn: () => listIssues({ environment, serviceName, page: 1, pageSize: 50 })
    })
  );
  const dependencyIssuesQuery = useQuery(
    useOpsQueryOptions("list", {
      queryKey: [
        ...opslensQueryKeys.issues({
          environment,
          serviceName: "all",
          search: "",
          status: "all",
          severity: "all",
          page: 1
        }),
        "service-health"
      ],
      queryFn: () => listIssues({ environment, page: 1, pageSize: 100 })
    })
  );
  const deploymentsQuery = useQuery(
    useOpsQueryOptions("list", {
      queryKey: opslensQueryKeys.deployments(environment),
      queryFn: () => getDeployments(environment)
    })
  );
  const settingsQuery = useQuery(
    useOpsQueryOptions("default", { queryKey: opslensQueryKeys.settings(), queryFn: getOpsSettings })
  );
  const freshnessQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: opslensQueryKeys.logSourceFreshness(),
      queryFn: getLogSourceFreshness,
      refetchInterval: 30_000
    })
  );
  const sloQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: opslensQueryKeys.serviceSlo(serviceName, environment),
      queryFn: () => getServiceSlo(serviceName, environment),
      refetchInterval: 60_000
    })
  );
  const issues = issuesQuery.data?.items ?? [];
  const openIssues = issues.filter((issue) => issue.status !== "resolved");
  const criticalHigh = openIssues.filter(
    (issue) => issue.severity === "critical" || issue.severity === "high"
  );
  const slaRisk = openIssues.filter(
    (issue) => issue.slaDueAt && new Date(issue.slaDueAt).getTime() < Date.now()
  );
  const catalog: ServiceCatalog = parseServiceCatalog(
    settingsQuery.data?.find((item) => item.key === "service.catalog")?.value
  );
  const service = catalog.services?.find((item) => item.name === serviceName);
  const dependencies = (service?.dependencies ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const dependents = (catalog.services ?? []).filter(
    (item) =>
      item.name !== serviceName &&
      (item.dependencies ?? "")
        .split(",")
        .map((dependency) => dependency.trim())
        .includes(serviceName)
  );
  const latestDeployment = deploymentsQuery.data?.find((item) =>
    item.scopeTags.some((tag) => tag === serviceName || tag.includes(serviceName))
  );
  const budgetRisk =
    sloQuery.data?.budgetConsumed ??
    Math.min(
      100,
      criticalHigh.length * 35 +
        slaRisk.length * 20 +
        Math.max(0, openIssues.length - criticalHigh.length) * 8
    );
  const staleSources = (freshnessQuery.data ?? []).filter(
    (item) => item.serviceName === serviceName && item.stale
  );
  const dependencyHealth = dependencies.map((dependency) => {
    const relatedIssues = (dependencyIssuesQuery.data?.items ?? []).filter(
      (item) => item.serviceName === dependency && item.status !== "resolved"
    );
    const urgent = relatedIssues.some((item) => item.severity === "critical" || item.severity === "high");
    return { name: dependency, urgent, openCount: relatedIssues.length };
  });

  if (issuesQuery.isLoading || settingsQuery.isLoading)
    return <OpsSectionSkeleton rows={6} className="p-[var(--space-5)]" />;
  const hasCriticalDataError = issuesQuery.isError || settingsQuery.isError;
  if (hasCriticalDataError) {
    return (
      <FeedbackState
        variant="error"
        size="lg"
        title={t("loadFailed")}
        description={t("loadFailedDescription")}
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={issuesQuery.isFetching || settingsQuery.isFetching}
            onClick={() => {
              void Promise.all([issuesQuery.refetch(), settingsQuery.refetch()]);
            }}
          >
            {t("retry")}
          </Button>
        }
      />
    );
  }

  return (
    <OpsPageShell>
      <OpsSectionCard
        title={t("title", { service: serviceName })}
        description={t("description", { environment })}
      >
        <Flex className="flex-wrap items-center gap-[var(--space-2)]">
          <Badge
            size="sm"
            variant={criticalHigh.length > 0 ? "danger" : openIssues.length > 0 ? "warning" : "success"}
          >
            {criticalHigh.length > 0 ? t("incident") : openIssues.length > 0 ? t("caution") : t("healthy")}
          </Badge>
          <Badge size="sm" variant="secondary">
            SLO {service?.slo || t("notConfigured")}
          </Badge>
          {service?.runbook ? (
            <Button asChild variant="outline" size="sm">
              <Link href={service.runbook} target="_blank">
                {t("openRunbook")}
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm">
            <Link href={`/issues?service=${encodeURIComponent(serviceName)}`}>{t("viewAllIssues")}</Link>
          </Button>
        </Flex>
      </OpsSectionCard>
      <Grid className="gap-[var(--space-3)] md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label={t("openIncidents")}
          value={formatNumber(openIssues.length, locale)}
          helper={t("criticalHigh", { count: criticalHigh.length })}
          color={criticalHigh.length > 0 ? "danger" : "default"}
        />
        <MetricCard
          label={t("slaRisk")}
          value={formatNumber(slaRisk.length, locale)}
          helper={t("pastDue")}
          color={slaRisk.length > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Error Budget"
          value={sloQuery.data?.budgetConsumed == null ? "—" : `${budgetRisk.toFixed(1)}%`}
          helper={
            sloQuery.data?.availability == null
              ? t("awaitingMetrics")
              : t("availability", {
                  value: sloQuery.data.availability.toFixed(3),
                  target: sloQuery.data.target
                })
          }
          color={budgetRisk >= 70 ? "danger" : budgetRisk >= 35 ? "warning" : "default"}
        />
        <MetricCard
          label={t("collectionStatus")}
          value={t("count", { count: staleSources.length })}
          helper={t("staleOver30m")}
          color={staleSources.length > 0 ? "warning" : "default"}
        />
        <MetricCard
          label={t("onCall")}
          value={service?.onCall || t("unassigned")}
          helper={service?.owner ? t("owner", { value: service.owner }) : t("setInCatalog")}
        />
      </Grid>
      <Grid className="gap-[var(--space-4)] xl:grid-cols-3">
        <OpsSectionCard
          title={t("activeIncidents")}
          description={t("activeIncidentsDescription")}
          className="xl:col-span-2"
        >
          {openIssues.length ? (
            <Box className="space-y-[var(--space-2)]">
              {openIssues.slice(0, 8).map((issue) => (
                <Link
                  key={issue.id}
                  href={`/issues/${issue.id}`}
                  className="border-default hover:border-primary/40 block rounded-[var(--radius-md)] border p-[var(--space-3)]"
                >
                  <Flex className="items-start justify-between gap-[var(--space-2)]">
                    <Box className="min-w-0">
                      <Typography as="p" variant="bodySm" className="font-semibold">
                        {issue.title}
                      </Typography>
                      <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">
                        {t("issueMeta", {
                          assignee: issue.assignee || t("unassigned"),
                          date: formatDateTime(issue.lastOccurredAt, locale)
                        })}
                      </Typography>
                    </Box>
                    <SeverityBadge severity={issue.severity} />
                  </Flex>
                </Link>
              ))}
            </Box>
          ) : (
            <FeedbackState variant="empty" size="sm" title={t("noOpenIncidents")} />
          )}
        </OpsSectionCard>
        <OpsSectionCard title={t("resources")} description={t("resourcesDescription")}>
          <Flex className="flex-wrap gap-[var(--space-2)]">
            {service?.repository ? (
              <Button asChild variant="outline" size="sm">
                <Link href={service.repository} target="_blank">
                  {t("repository")}
                </Link>
              </Button>
            ) : null}
            {service?.dashboard ? (
              <Button asChild variant="outline" size="sm">
                <Link href={service.dashboard} target="_blank">
                  {t("dashboard")}
                </Link>
              </Button>
            ) : null}
          </Flex>
          <Box className="mt-[var(--space-3)]">
            <Typography as="p" variant="caption" color="muted">
              {t("dependencyHealth")}
            </Typography>
            <Box className="mt-[var(--space-1)] space-y-[var(--space-1)]">
              {dependencyHealth.length ? (
                dependencyHealth.map((dependency) => (
                  <Flex key={dependency.name} className="items-center justify-between gap-[var(--space-2)]">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/services/${encodeURIComponent(dependency.name)}`}>{dependency.name}</Link>
                    </Button>
                    <Badge
                      size="sm"
                      variant={
                        dependency.urgent ? "danger" : dependency.openCount > 0 ? "warning" : "success"
                      }
                    >
                      {dependency.urgent
                        ? t("impactDetected")
                        : dependency.openCount > 0
                          ? t("openIssues", { count: dependency.openCount })
                          : t("healthy")}
                    </Badge>
                  </Flex>
                ))
              ) : (
                <Typography as="p" variant="caption" color="muted">
                  {t("notRegistered")}
                </Typography>
              )}
            </Box>
          </Box>
          <Box className="mt-[var(--space-3)]">
            <Typography as="p" variant="caption" color="muted">
              {t("dependents")}
            </Typography>
            <Flex className="mt-[var(--space-1)] flex-wrap gap-[var(--space-1)]">
              {dependents.length ? (
                dependents.map((dependent) => (
                  <Button key={dependent.name} asChild variant="outline" size="sm">
                    <Link href={`/services/${encodeURIComponent(dependent.name ?? "")}`}>
                      {dependent.name}
                    </Link>
                  </Button>
                ))
              ) : (
                <Typography as="p" variant="caption" color="muted">
                  {t("notRegistered")}
                </Typography>
              )}
            </Flex>
          </Box>
        </OpsSectionCard>
        <OpsSectionCard
          title={t("latestDeployment")}
          description={t("latestDeploymentDescription")}
          className="xl:col-span-3"
        >
          {latestDeployment ? (
            <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
              <Typography as="p" variant="bodySm" className="font-semibold">
                {latestDeployment.version}
              </Typography>
              <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">
                {t("deploymentMeta", {
                  date: formatDateTime(latestDeployment.deployedAt, locale),
                  status: latestDeployment.approvalStatus
                })}
              </Typography>
              <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-2)]">
                {latestDeployment.changelog}
              </Typography>
              <Button asChild variant="outline" size="sm" className="mt-[var(--space-3)]">
                <Link href="/deployments">{t("viewDeployment")}</Link>
              </Button>
            </Box>
          ) : (
            <FeedbackState variant="empty" size="sm" title={t("noDeployments")} />
          )}
        </OpsSectionCard>
      </Grid>
    </OpsPageShell>
  );
}
