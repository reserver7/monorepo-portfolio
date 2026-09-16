"use client";

import { MetricCard } from "@/features/common/components/feedback-state";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Box, Button, Flex, Grid, Input, Textarea, Typography, toast } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { useAppForm } from "@repo/forms";
import {
  getDeploymentImpact,
  getDeploymentReadiness,
  getDeployments,
  opslensQueryKeys,
  registerDeployment,
  updateDeploymentDecision
} from "@repo/opslens";
import { OpsPageShell, OpsSectionCard } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsPermissions } from "@/features/common/hooks/use-ops-permissions";
import { useOpsFilters } from "@/features/common/stores";
import { formatNumber } from "@repo/utils";
import { DeploymentHistoryList, DeploymentImpactPanel, DeploymentRegisterForm } from "../components";
import { resolveLocalizedError } from "@/lib/i18n/errors";
import { DEPLOYMENT_FORM_DEFAULT_VALUES } from "../constants";
import type { DeploymentFormValues } from "../types";

export default function DeploymentsPage() {
  const t = useTranslations("deployments");
  const tError = useTranslations("error");
  const readinessLabel = (status: string) => {
    if (status === "blocked") return t("screen.gateBlocked");
    if (status === "approval_required") return t("screen.gateApprovalRequired");
    return t("screen.gateReady");
  };
  const approvalStatusLabel = (status: string) =>
    status === "approved"
      ? t("screen.approved")
      : status === "rejected"
        ? t("screen.rejected")
        : t("screen.pending");
  const rollbackStatusLabel = (status: string) =>
    status === "rolled_back"
      ? t("screen.rolledBack")
      : status === "rollback_requested"
        ? t("screen.rollbackRequested")
        : t("screen.pending");
  const { environment } = useOpsFilters();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { canOperate } = useOpsPermissions();

  const form = useAppForm<DeploymentFormValues>({
    defaultValues: DEPLOYMENT_FORM_DEFAULT_VALUES
  });

  const deploymentsQuery = useQuery(
    useOpsQueryOptions("list", {
      queryKey: opslensQueryKeys.deployments(environment),
      queryFn: () => getDeployments(environment)
    })
  );

  const deployments = deploymentsQuery.data ?? [];
  const latestVersion = useMemo(() => deployments[0]?.version, [deployments]);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);
  const [decisionActor, setDecisionActor] = useState("");
  const [decisionReason, setDecisionReason] = useState("");

  const impactQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: opslensQueryKeys.deploymentImpact(environment, selectedVersion),
      queryFn: () => getDeploymentImpact(selectedVersion!, environment),
      enabled: Boolean(selectedVersion)
    })
  );
  const readinessQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: opslensQueryKeys.deploymentReadiness(environment),
      queryFn: () => getDeploymentReadiness(environment)
    })
  );

  const createMutation = useMutation({
    mutationFn: (values: DeploymentFormValues) =>
      registerDeployment({
        version: values.version.trim(),
        status: values.status,
        owner: values.owner.trim(),
        approver: values.approver.trim() || undefined,
        overrideReason: values.overrideReason.trim() || undefined,
        scopeTags: values.scopeTags,
        checklist: values.checklist,
        rollbackCriteria: values.rollbackCriteria.trim() || undefined,
        monitoringWindowMin: values.monitoringWindowMin,
        ciUrl: values.ciUrl.trim() || undefined,
        changelog: values.changelog.trim(),
        environment
      }),
    onSuccess: async (deployment) => {
      setSelectedVersion(deployment.version);
      form.reset(DEPLOYMENT_FORM_DEFAULT_VALUES);
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.deployments(environment) });
    }
  });
  const selectedDeployment = useMemo(
    () => deployments.find((deployment) => deployment.version === selectedVersion),
    [deployments, selectedVersion]
  );
  const increasedIssueCount = impactQuery.data?.increasedIssueCount ?? 0;
  const totalAfterErrorCount = impactQuery.data?.totalAfterErrorCount ?? 0;
  const decisionMutation = useMutation({
    mutationFn: (decision: "approved" | "rejected" | "rollback_requested" | "rolled_back") =>
      updateDeploymentDecision({
        deploymentId: selectedDeployment!.id,
        decision,
        approver: decision === "approved" || decision === "rejected" ? decisionActor : undefined,
        reason: decision === "rollback_requested" || decision === "rolled_back" ? decisionReason : undefined
      }),
    onSuccess: async () => {
      setDecisionReason("");
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.deployments(environment) });
      toast.success(t("screen.decisionRecorded"));
    },
    onError: (error) =>
      toast.error(resolveLocalizedError(error, tError as never, t("screen.decisionSaveFailed")))
  });

  return (
    <OpsPageShell>
      <Box className="border-default bg-surface rounded-[var(--radius-xl)] border px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-5)]">
        <Flex className="flex-col items-stretch justify-between gap-[var(--space-3)] sm:flex-row sm:items-center">
          <Box className="min-w-0">
            <Typography as="h2" variant="headingMd" className="tracking-[-0.01em]">
              {t("screen.title")}
            </Typography>
          </Box>
          <Flex className="shrink-0 flex-wrap justify-start gap-[var(--space-2)] sm:justify-end">
            <Badge
              variant="secondary"
              size="sm"
              shape="rounded"
              className="border-default bg-surface-elevated border font-semibold"
            >
              {t("screen.environment", { environment })}
            </Badge>
          </Flex>
        </Flex>
      </Box>

      <Grid className="gap-[var(--space-3)] xl:grid-cols-[minmax(0,1fr)_420px]">
        <Grid className="gap-[var(--space-3)] md:grid-cols-2">
          <MetricCard
            label={t("screen.deploymentHistory")}
            value={formatNumber(deployments.length, locale)}
            helper={
              latestVersion
                ? t("screen.latestVersion", { version: latestVersion })
                : t("screen.noDeployments")
            }
            size="sm"
            className="h-full rounded-[var(--radius-lg)]"
          />
          <MetricCard
            label={t("screen.increasedIssues")}
            value={formatNumber(increasedIssueCount, locale)}
            helper={selectedVersion ? t("screen.selectedDeployment") : t("screen.analysisPending")}
            color={increasedIssueCount > 0 ? "warning" : "default"}
            size="sm"
            className="h-full rounded-[var(--radius-lg)]"
          />
        </Grid>
        <MetricCard
          label={t("screen.afterErrors")}
          value={formatNumber(totalAfterErrorCount, locale)}
          helper={selectedDeployment ? selectedDeployment.version : t("screen.selectVersion")}
          color={totalAfterErrorCount > 0 ? "info" : "default"}
          size="sm"
          className="h-full rounded-[var(--radius-lg)]"
        />
      </Grid>

      {readinessQuery.data ? (
        <OpsSectionCard title={t("screen.gateTitle")} description={t("screen.gateDescription")}>
          <Flex className="flex-wrap items-start justify-between gap-[var(--space-3)]">
            <Flex className="flex-wrap items-center gap-[var(--space-2)]">
              <Badge
                size="sm"
                variant={
                  readinessQuery.data.status === "blocked"
                    ? "danger"
                    : readinessQuery.data.status === "approval_required"
                      ? "warning"
                      : "success"
                }
              >
                {readinessLabel(readinessQuery.data.status)}
              </Badge>
              <Typography as="p" variant="caption" color="muted">
                {t("screen.criticalHighUnassigned", {
                  criticalHigh: readinessQuery.data.criticalHighCount,
                  unassigned: readinessQuery.data.unassignedCount
                })}
              </Typography>
            </Flex>
            <Box className="min-w-0 flex-1 xl:max-w-[720px]">
              {readinessQuery.data.recommendations.map((recommendation) => (
                <Typography
                  key={recommendation}
                  as="p"
                  variant="caption"
                  color="muted"
                  className="mb-[var(--space-1)]"
                >
                  • {recommendation}
                </Typography>
              ))}
            </Box>
          </Flex>
        </OpsSectionCard>
      ) : null}

      <Grid className="items-start gap-[var(--space-4)] xl:grid-cols-[minmax(0,1fr)_420px]">
        <Box className="min-w-0 space-y-[var(--space-4)]">
          <Grid className="gap-[var(--space-4)] 2xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
            <OpsSectionCard title={t("screen.historyTitle")} description={t("screen.historyDescription")}>
              <Flex className="items-center justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedVersion(latestVersion)}
                  disabled={!latestVersion}
                >
                  {t("screen.latestAnalysis")}
                </Button>
              </Flex>
              <DeploymentHistoryList
                deployments={deployments}
                isError={deploymentsQuery.isError}
                isLoading={deploymentsQuery.isLoading}
                latestVersion={latestVersion}
                selectedVersion={selectedVersion}
                onSelectVersion={setSelectedVersion}
              />
            </OpsSectionCard>

            <OpsSectionCard title={t("screen.impactTitle")} description={t("screen.impactDescription")}>
              <DeploymentImpactPanel
                impact={impactQuery.data}
                isError={impactQuery.isError}
                isLoading={impactQuery.isLoading}
                selectedVersion={selectedVersion}
              />
            </OpsSectionCard>

            {selectedDeployment ? (
              <OpsSectionCard
                title={t("screen.approvalRollbackTitle")}
                description={t("screen.approvalRollbackDescription")}
              >
                <Box className="space-y-[var(--space-3)]">
                  <Flex className="flex-wrap gap-[var(--space-2)]">
                    <Badge
                      size="sm"
                      variant={
                        selectedDeployment.approvalStatus === "approved"
                          ? "success"
                          : selectedDeployment.approvalStatus === "rejected"
                            ? "danger"
                            : "secondary"
                      }
                    >
                      {t("screen.approvalStatus", {
                        status: approvalStatusLabel(selectedDeployment.approvalStatus)
                      })}
                    </Badge>
                    <Badge
                      size="sm"
                      variant={
                        selectedDeployment.rollbackStatus === "rolled_back"
                          ? "danger"
                          : selectedDeployment.rollbackStatus === "rollback_requested"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {t("screen.rollbackStatus", {
                        status: rollbackStatusLabel(selectedDeployment.rollbackStatus)
                      })}
                    </Badge>
                  </Flex>
                  {selectedDeployment.ciUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={selectedDeployment.ciUrl} target="_blank" rel="noreferrer">
                        {t("screen.viewCi")}
                      </a>
                    </Button>
                  ) : null}
                  {canOperate ? (
                    <>
                      <Input
                        label={t("screen.approver")}
                        value={decisionActor}
                        onChange={(event) => setDecisionActor(event.target.value)}
                        placeholder={t("screen.approverPlaceholder")}
                      />
                      <Flex className="flex-wrap gap-[var(--space-2)]">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          loading={decisionMutation.isPending}
                          disabled={!decisionActor.trim()}
                          onClick={() => decisionMutation.mutate("approved")}
                        >
                          {t("screen.recordApproval")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          loading={decisionMutation.isPending}
                          disabled={!decisionActor.trim()}
                          onClick={() => decisionMutation.mutate("rejected")}
                        >
                          {t("screen.recordRejection")}
                        </Button>
                      </Flex>
                      <Textarea
                        label={t("screen.rollbackReason")}
                        value={decisionReason}
                        onChange={(event) => setDecisionReason(event.target.value)}
                        rows={2}
                        placeholder={t("screen.rollbackPlaceholder")}
                      />
                      <Flex className="flex-wrap gap-[var(--space-2)]">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          loading={decisionMutation.isPending}
                          disabled={!decisionReason.trim()}
                          onClick={() => decisionMutation.mutate("rollback_requested")}
                        >
                          {t("screen.requestRollback")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          loading={decisionMutation.isPending}
                          disabled={!decisionReason.trim()}
                          onClick={() => decisionMutation.mutate("rolled_back")}
                        >
                          {t("screen.completeRollback")}
                        </Button>
                      </Flex>
                    </>
                  ) : null}
                </Box>
              </OpsSectionCard>
            ) : null}
          </Grid>
        </Box>

        <Box className="min-w-0">
          <OpsSectionCard
            title={t("screen.registerTitle")}
            description={canOperate ? t("screen.registerDescription") : t("screen.viewerDescription")}
          >
            {canOperate ? (
              <DeploymentRegisterForm
                form={form}
                isSubmitting={createMutation.isPending}
                onSubmit={(values) => createMutation.mutate(values)}
              />
            ) : (
              <Typography as="p" variant="bodySm" color="muted">
                {t("screen.viewerDescription")}
              </Typography>
            )}
          </OpsSectionCard>
        </Box>
      </Grid>
    </OpsPageShell>
  );
}
