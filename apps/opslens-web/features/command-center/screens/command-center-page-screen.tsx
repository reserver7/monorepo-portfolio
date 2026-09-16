"use client";

import { FeedbackState } from "@/features/common/components/feedback-state";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  getDeploymentImpact,
  getDeployments,
  getOpsAlerts,
  getOpsSettings,
  listIssues,
  opslensQueryKeys,
  type Issue,
  updateIssueStatus
} from "@repo/opslens";
import { Badge, Box, Button, Flex, Grid, Select, Typography } from "@repo/ui";
import { AlertTriangle, ExternalLink, ShieldAlert, Siren } from "lucide-react";
import { OpsPageShell, OpsSectionCard, OpsSectionSkeleton, SeverityBadge, StatusBadge } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsFilters } from "@/features/common/stores";
import { formatDateTime, formatNumber } from "@repo/utils";
import { isIssueSlaRisk } from "@/features/issues/utils/issues-utils";
import { useOpsPermissions } from "@/features/common/hooks/use-ops-permissions";
import { parseEscalationPolicy } from "@/features/settings/components";
import { parseServiceCatalog } from "@/features/common/utils/ops-display";

const isActiveIncident = (issue: Issue) =>
  issue.status !== "resolved" &&
  (issue.severity === "critical" || issue.severity === "high" || isIssueSlaRisk(issue));

export default function CommandCenterPage() {
  const t = useTranslations("commandCenter");
  const locale = useLocale();
  const { environment, serviceName, search } = useOpsFilters();
  const { canOperate } = useOpsPermissions();
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState<string>();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const issuesQuery = useQuery(
    useOpsQueryOptions("list", {
      queryKey: [
        ...opslensQueryKeys.issues({
          environment,
          serviceName,
          search,
          status: "all",
          severity: "all",
          page: 1
        }),
        "command-center"
      ],
      queryFn: () =>
        listIssues({
          environment,
          serviceName: serviceName === "all" ? undefined : serviceName,
          query: search || undefined,
          page: 1,
          pageSize: 100
        }),
      refetchInterval: 30_000
    })
  );
  const alertsQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: [...opslensQueryKeys.alerts(), "command-center"],
      queryFn: getOpsAlerts,
      refetchInterval: 15_000
    })
  );
  const deploymentsQuery = useQuery(
    useOpsQueryOptions("list", {
      queryKey: opslensQueryKeys.deployments(environment),
      queryFn: () => getDeployments(environment)
    })
  );
  const settingsQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: opslensQueryKeys.settings(),
      queryFn: getOpsSettings,
      staleTime: 30_000
    })
  );
  const deploymentVersion = selectedVersion ?? deploymentsQuery.data?.[0]?.version;
  const impactQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: opslensQueryKeys.deploymentImpact(environment, deploymentVersion),
      queryFn: () => getDeploymentImpact(deploymentVersion!, environment),
      enabled: Boolean(deploymentVersion)
    })
  );
  const startResponseMutation = useMutation({
    mutationFn: (issueId: string) => updateIssueStatus(issueId, "analyzing"),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: opslensQueryKeys.all })
  });

  const incidents = useMemo(
    () =>
      (issuesQuery.data?.items ?? [])
        .filter(isActiveIncident)
        .sort(
          (a, b) =>
            Number(isIssueSlaRisk(b)) - Number(isIssueSlaRisk(a)) ||
            new Date(b.lastOccurredAt).getTime() - new Date(a.lastOccurredAt).getTime()
        ),
    [issuesQuery.data?.items]
  );
  const unacknowledgedAlerts = (alertsQuery.data ?? []).filter(
    (alert) => !alert.readAt && (alert.level === "critical" || alert.level === "high")
  );
  const unassigned = incidents.filter((incident) => !incident.assignee).length;
  const slaRisk = incidents.filter(isIssueSlaRisk).length;
  const onCall = settingsQuery.data?.find((setting) => setting.key === "alert.on_call")?.value;
  const escalationPolicy = useMemo(
    () =>
      parseEscalationPolicy(
        settingsQuery.data?.find((setting) => setting.key === "alert.escalation_policy")?.value
      ),
    [settingsQuery.data]
  );
  const updateTimes = [
    issuesQuery.dataUpdatedAt,
    alertsQuery.dataUpdatedAt,
    deploymentsQuery.dataUpdatedAt
  ].filter((value) => value > 0);
  const dataUpdatedAt = updateTimes.length > 0 ? Math.min(...updateTimes) : null;
  const dataAgeSec =
    dataUpdatedAt == null ? null : Math.max(0, Math.floor((Date.now() - dataUpdatedAt) / 1000));
  const serviceCatalog = useMemo(
    () =>
      parseServiceCatalog(settingsQuery.data?.find((setting) => setting.key === "service.catalog")?.value),
    [settingsQuery.data]
  );
  const compareItems = incidents.filter((incident) => compareIds.includes(incident.id));
  const escalationQueue = incidents.filter((incident) => {
    const acknowledgementDueAt =
      new Date(incident.firstOccurredAt).getTime() + escalationPolicy.acknowledgeWithinMinutes * 60_000;
    const statusDueAt = incident.nextUpdateAt
      ? new Date(incident.nextUpdateAt).getTime()
      : new Date(incident.acknowledgedAt ?? incident.firstOccurredAt).getTime() +
        escalationPolicy.statusUpdateWithinMinutes * 60_000;
    return (!incident.acknowledgedAt && acknowledgementDueAt < Date.now()) || statusDueAt < Date.now();
  });
  const toggleCompare = (id: string) =>
    setCompareIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : previous.length < 2
          ? [...previous, id]
          : [previous[1]!, id]
    );
  const criticalQueryError = issuesQuery.isError || settingsQuery.isError;

  return (
    <OpsPageShell>
      <Box className="border-default bg-surface rounded-[var(--radius-xl)] border px-[var(--space-4)] py-[var(--space-4)] shadow-sm md:px-[var(--space-6)]">
        <Flex className="flex-col items-stretch justify-between gap-[var(--space-3)] sm:flex-row sm:items-center">
          <Box className="min-w-0">
            <Typography as="h2" variant="headingMd">
              {t("title")}
            </Typography>
            <Flex className="mt-[var(--space-1)] flex-wrap gap-[var(--space-2)]">
              <Typography as="p" variant="caption" color="muted">
                {environment} 환경의 실시간 대응 큐 · 30초마다 갱신
              </Typography>
              <Badge size="sm" variant={dataAgeSec != null && dataAgeSec > 90 ? "warning" : "success"}>
                {dataAgeSec == null ? t("dataWaiting") : t("updatedSecondsAgo", { count: dataAgeSec })}
              </Badge>
            </Flex>
          </Box>
          <Flex className="grid grid-cols-2 gap-[var(--space-2)] sm:flex sm:flex-wrap">
            <Button asChild variant="secondary" size="md" className="w-full sm:w-auto">
              <Link href="/issues?assignee=me">{t("quickLinks.myQueue")}</Link>
            </Button>
            <Button asChild variant="primary" size="md" className="w-full sm:w-auto">
              <Link href="/logs">{t("quickLinks.exploreLogs")}</Link>
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Grid className="gap-[var(--space-3)] md:grid-cols-4">
        <Metric
          icon={<Siren className="text-danger h-4 w-4" />}
          label={t("metrics.immediateResponse")}
          value={incidents.length}
          helper={t("metrics.immediateHelper")}
          tone="danger"
        />
        <Metric
          icon={<Siren className="text-danger h-4 w-4" />}
          label={t("metrics.escalation")}
          value={escalationQueue.length}
          helper={t("metrics.escalationHelper", {
            acknowledge: escalationPolicy.acknowledgeWithinMinutes,
            update: escalationPolicy.statusUpdateWithinMinutes
          })}
          tone="danger"
        />
        <Metric
          icon={<ShieldAlert className="text-warning h-4 w-4" />}
          label={t("metrics.unassigned")}
          value={unassigned}
          helper={t("metrics.unassignedHelper")}
          tone="warning"
        />
        <Metric
          icon={<AlertTriangle className="text-primary h-4 w-4" />}
          label={t("metrics.slaRisk")}
          value={slaRisk}
          helper={t("metrics.slaRiskHelper")}
          tone="primary"
        />
      </Grid>

      <Grid className="items-start gap-[var(--space-4)] xl:grid-cols-[minmax(0,1fr)_360px]">
        <OpsSectionCard title={t("incidents.title")} description={t("incidents.description")}>
          {issuesQuery.isLoading || settingsQuery.isLoading ? (
            <OpsSectionSkeleton rows={4} />
          ) : criticalQueryError ? (
            <FeedbackState
              variant="error"
              size="sm"
              title={t("incidents.loadFailed")}
              description={t("incidents.loadFailedDescription")}
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
          ) : incidents.length === 0 ? (
            <FeedbackState variant="empty" size="sm" title={t("incidents.empty")} />
          ) : (
            <Box className="space-y-[var(--space-2)]">
              {incidents.map((incident) => {
                const service = serviceCatalog.services?.find((item) => item.name === incident.serviceName);
                return (
                  <Box
                    key={incident.id}
                    className="border-default bg-surface-elevated rounded-[var(--radius-lg)] border p-[var(--space-4)]"
                  >
                    <Flex className="flex-col items-stretch justify-between gap-[var(--space-3)] sm:flex-row sm:items-start">
                      <Box className="min-w-0">
                        <Flex className="flex-wrap gap-[var(--space-1)]">
                          <SeverityBadge severity={incident.severity} />
                          <StatusBadge status={incident.status} />
                          {isIssueSlaRisk(incident) ? (
                            <Badge variant="warning" size="sm">
                              {t("metrics.slaRisk")}
                            </Badge>
                          ) : null}
                        </Flex>
                        <Typography as="p" variant="bodySm" className="mt-[var(--space-2)] font-semibold">
                          {incident.title}
                        </Typography>
                        <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">
                          {incident.serviceName} ·{" "}
                          {t("owner", { owner: incident.assignee || service?.owner || t("unassignedValue") })}{" "}
                          · {t("recent")} {formatDateTime(incident.lastOccurredAt, locale)}
                        </Typography>
                        {service ? (
                          <Flex className="mt-[var(--space-1)] flex-wrap gap-[var(--space-1)]">
                            <Badge size="sm" variant="outline">
                              SLO {service.slo || t("notConfigured")}
                            </Badge>
                            {service.onCall ? (
                              <Badge size="sm" variant="secondary">
                                온콜 {service.onCall}
                              </Badge>
                            ) : null}
                            {service.runbook ? (
                              <Link
                                href={service.runbook}
                                target="_blank"
                                className="text-primary text-caption font-semibold hover:underline"
                              >
                                {t("actions.openRunbook")}
                              </Link>
                            ) : null}
                          </Flex>
                        ) : null}
                      </Box>
                      <Flex className="grid grid-cols-2 gap-[var(--space-2)] sm:flex sm:shrink-0 sm:flex-col">
                        <Button
                          type="button"
                          variant={compareIds.includes(incident.id) ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full"
                          onClick={() => toggleCompare(incident.id)}
                        >
                          {compareIds.includes(incident.id)
                            ? t("actions.removeCompare")
                            : t("actions.addCompare")}
                        </Button>
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/issues/${incident.id}`}>
                            {t("actions.viewDetails")} <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="w-full">
                          <Link href={`/services/${encodeURIComponent(incident.serviceName)}`}>
                            {t("actions.viewService")}
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="w-full">
                          <Link href={`/logs?service=${encodeURIComponent(incident.serviceName)}`}>
                            {t("actions.exploreLogs")}
                          </Link>
                        </Button>
                        {canOperate && incident.status === "new" ? (
                          <Button
                            type="button"
                            size="sm"
                            className="col-span-2 w-full"
                            loading={
                              startResponseMutation.isPending &&
                              startResponseMutation.variables === incident.id
                            }
                            onClick={() => startResponseMutation.mutate(incident.id)}
                          >
                            {t("actions.startResponse")}
                          </Button>
                        ) : null}
                      </Flex>
                    </Flex>
                  </Box>
                );
              })}
            </Box>
          )}
          {compareItems.length === 2 ? (
            <Box className="border-primary/30 bg-primary/5 mt-[var(--space-3)] rounded-[var(--radius-md)] border p-[var(--space-3)]">
              <Flex className="items-center justify-between">
                <Typography as="p" variant="bodySm" className="font-semibold">
                  {t("actions.compareIncidents")}
                </Typography>
                <Button type="button" variant="ghost" size="sm" onClick={() => setCompareIds([])}>
                  {t("close")}
                </Button>
              </Flex>
              <Grid className="mt-[var(--space-2)] gap-[var(--space-2)] md:grid-cols-2">
                {compareItems.map((item) => (
                  <Box
                    key={item.id}
                    className="border-default bg-surface rounded-[var(--radius-sm)] border p-[var(--space-2)]"
                  >
                    <Typography as="p" variant="caption" className="font-semibold">
                      {item.title}
                    </Typography>
                    <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">
                      {item.severity} · {item.status} · 발생 {formatNumber(item.occurrenceCount, locale)}회
                    </Typography>
                    <Typography as="p" variant="caption" color="muted">
                      {t("owner", { owner: item.assignee || t("unassignedValue") })} · {t("recent")}{" "}
                      {formatDateTime(item.lastOccurredAt, locale)}
                    </Typography>
                  </Box>
                ))}
              </Grid>
            </Box>
          ) : null}
        </OpsSectionCard>

        <Box className="space-y-[var(--space-4)]">
          <OpsSectionCard title={t("escalation.title")} description={t("escalation.description")}>
            {escalationQueue.length ? (
              <Box className="space-y-[var(--space-2)]">
                {escalationQueue.slice(0, 4).map((incident) => (
                  <Box
                    key={incident.id}
                    className="border-danger/30 bg-danger/5 rounded-[var(--radius-md)] border p-[var(--space-2)]"
                  >
                    <Flex className="items-start justify-between gap-[var(--space-2)]">
                      <Box className="min-w-0">
                        <Typography as="p" variant="caption" className="font-semibold">
                          {incident.title}
                        </Typography>
                        <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">
                          L{incident.escalationLevel} ·{" "}
                          {incident.acknowledgedAt
                            ? t("escalation.statusUpdateRequired")
                            : t("escalation.acknowledgeRequired")}
                        </Typography>
                      </Box>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/issues/${incident.id}`}>{t("actions.respond")}</Link>
                      </Button>
                    </Flex>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography as="p" variant="bodySm" color="muted">
                {t("escalation.empty")}
              </Typography>
            )}
            <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-3)]">
              {t("escalation.targets", { targets: escalationPolicy.escalationTargets })}
            </Typography>
            <Button asChild variant="ghost" size="sm" className="mt-[var(--space-2)]">
              <Link href="/settings?tab=notifications">{t("actions.adjustPolicy")}</Link>
            </Button>
          </OpsSectionCard>
          <OpsSectionCard title={t("deployment.title")} description={t("deployment.description")}>
            <Select
              aria-label={t("deployment.selectVersion")}
              value={deploymentVersion ?? ""}
              onChange={(value) => setSelectedVersion(String(value))}
              options={(deploymentsQuery.data ?? []).map((deployment) => ({
                label: deployment.version,
                value: deployment.version
              }))}
              className="mb-[var(--space-3)]"
            />
            {impactQuery.isLoading ? (
              <OpsSectionSkeleton rows={3} />
            ) : impactQuery.data ? (
              <Box className="space-y-[var(--space-2)]">
                <Badge
                  size="sm"
                  variant={
                    impactQuery.data.riskLevel === "rollback_review"
                      ? "danger"
                      : impactQuery.data.riskLevel === "caution"
                        ? "warning"
                        : "success"
                  }
                >
                  {impactQuery.data.riskLevel === "rollback_review"
                    ? t("deployment.rollbackReview")
                    : impactQuery.data.riskLevel === "caution"
                      ? t("deployment.observe")
                      : t("deployment.normal")}
                </Badge>
                <Typography as="p" variant="bodySm">
                  {impactQuery.data.recommendedAction}
                </Typography>
                <Typography as="p" variant="caption" color="muted">
                  증가 이슈 {formatNumber(impactQuery.data.increasedIssueCount, locale)}건 · 배포 후 오류{" "}
                  {formatNumber(impactQuery.data.totalAfterErrorCount, locale)}건
                </Typography>
                <Button asChild variant="outline" size="sm">
                  <Link href="/deployments">{t("deployment.viewDetails")}</Link>
                </Button>
              </Box>
            ) : (
              <FeedbackState variant="empty" size="sm" title={t("deployment.empty")} />
            )}
          </OpsSectionCard>
          <OpsSectionCard title={t("onCall.title")} description={t("onCall.description")}>
            <Typography as="p" variant="bodySm" color="muted">
              {t("onCall.unread", { count: unacknowledgedAlerts.length })}{" "}
              {onCall ? t("onCall.current", { owner: onCall }) : t("onCall.empty")}
            </Typography>
            <Button asChild variant="outline" size="sm" className="mt-[var(--space-3)]">
              <Link href="/settings?tab=notifications">{t("onCall.settings")}</Link>
            </Button>
          </OpsSectionCard>
          <OpsSectionCard title={t("slo.title")} description={t("slo.description")}>
            {(serviceCatalog.services ?? []).length > 0 ? (
              <Box className="space-y-[var(--space-1)]">
                {serviceCatalog.services?.slice(0, 4).map((service) => (
                  <Flex key={service.name} className="items-center justify-between gap-[var(--space-2)]">
                    <Typography as="span" variant="caption">
                      {service.name}
                    </Typography>
                    <Badge size="sm" variant="secondary">
                      SLO {service.slo || t("notConfigured")}
                    </Badge>
                  </Flex>
                ))}
              </Box>
            ) : (
              <Typography as="p" variant="caption" color="muted">
                {t("slo.registerHint")}
              </Typography>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-[var(--space-2)]">
              <Link href="/settings?tab=workspace">{t("slo.manageCatalog")}</Link>
            </Button>
          </OpsSectionCard>
        </Box>
      </Grid>
    </OpsPageShell>
  );
}

function Metric({
  icon,
  label,
  value,
  helper,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  helper: string;
  tone: "danger" | "warning" | "primary";
}) {
  const locale = useLocale();
  return (
    <Box className="border-default bg-surface rounded-[var(--radius-lg)] border p-[var(--space-3)]">
      <Flex className="items-center justify-between">
        <Typography as="p" variant="caption" color="muted">
          {label}
        </Typography>
        {icon}
      </Flex>
      <Typography
        as="p"
        variant="headingMd"
        className={`mt-[var(--space-2)] ${tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-primary"}`}
      >
        {formatNumber(value, locale)}건
      </Typography>
      <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-1)]">
        {helper}
      </Typography>
    </Box>
  );
}
