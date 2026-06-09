"use client";

import { useMemo, useState } from "react";
import { Badge, Box, Button, Flex, Grid, Spinner, StatCard, Typography } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { useAppForm } from "@repo/forms";
import { getDeploymentImpact, getDeployments, opslensQueryKeys, registerDeployment } from "@repo/opslens";
import { OpsPageShell, OpsSectionCard } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsFilters } from "@/features/common/stores";
import { formatNumber } from "@repo/utils";
import { DeploymentHistoryList, DeploymentImpactPanel, DeploymentRegisterForm } from "../components";
import { DEPLOYMENT_FORM_DEFAULT_VALUES } from "../constants";
import type { DeploymentFormValues } from "../types";

export default function DeploymentsPage() {
  const { environment } = useOpsFilters();
  const queryClient = useQueryClient();

  const form = useAppForm<DeploymentFormValues>({
    defaultValues: DEPLOYMENT_FORM_DEFAULT_VALUES
  });

  const deploymentsQuery = useQuery(useOpsQueryOptions("list", {
    queryKey: opslensQueryKeys.deployments(environment),
    queryFn: () => getDeployments(environment)
  }));

  const deployments = deploymentsQuery.data ?? [];
  const latestVersion = useMemo(() => deployments[0]?.version, [deployments]);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);

  const impactQuery = useQuery(useOpsQueryOptions("default", {
    queryKey: opslensQueryKeys.deploymentImpact(environment, selectedVersion),
    queryFn: () => getDeploymentImpact(selectedVersion!, environment),
    enabled: Boolean(selectedVersion)
  }));

  const createMutation = useMutation({
    mutationFn: (values: DeploymentFormValues) =>
      registerDeployment({
        version: values.version.trim(),
        status: values.status,
        owner: values.owner.trim(),
        approver: values.approver.trim() || undefined,
        scopeTags: values.scopeTags,
        checklist: values.checklist,
        rollbackCriteria: values.rollbackCriteria.trim() || undefined,
        monitoringWindowMin: values.monitoringWindowMin,
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

  return (
    <OpsPageShell>
      <Box className="border-default bg-surface rounded-[var(--radius-xl)] border px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-5)]">
        <Flex className="items-center justify-between gap-[var(--space-3)]">
          <Box className="min-w-0">
            <Typography as="h2" variant="headingMd" className="tracking-[-0.01em]">
              배포 운영
            </Typography>
          </Box>
          <Flex className="shrink-0 flex-wrap justify-end gap-[var(--space-2)]">
            <Badge variant="secondary" size="sm" shape="rounded" className="border border-default bg-surface-elevated font-semibold">
              환경: {environment}
            </Badge>
          </Flex>
        </Flex>
      </Box>

      <Grid className="gap-[var(--space-3)] xl:grid-cols-[minmax(0,1fr)_420px]">
        <Grid className="gap-[var(--space-3)] md:grid-cols-2">
          <StatCard
            label="배포 이력"
            value={formatNumber(deployments.length)}
            helper={latestVersion ? `최신 ${latestVersion}` : "등록된 배포 없음"}
            size="sm"
            className="h-full rounded-[var(--radius-lg)]"
          />
          <StatCard
            label="증가 이슈"
            value={formatNumber(increasedIssueCount)}
            helper={selectedVersion ? "선택 배포 기준" : "분석 대기"}
            color={increasedIssueCount > 0 ? "warning" : "default"}
            size="sm"
            className="h-full rounded-[var(--radius-lg)]"
          />
        </Grid>
        <StatCard
          label="배포 후 에러"
          value={formatNumber(totalAfterErrorCount)}
          helper={selectedDeployment ? selectedDeployment.version : "버전을 선택하세요"}
          color={totalAfterErrorCount > 0 ? "info" : "default"}
          size="sm"
          className="h-full rounded-[var(--radius-lg)]"
        />
      </Grid>

      <Grid className="items-start gap-[var(--space-4)] xl:grid-cols-[minmax(0,1fr)_420px]">
        <Box className="min-w-0 space-y-[var(--space-4)]">
          <Grid className="gap-[var(--space-4)] 2xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
            <OpsSectionCard title="배포 이력" description="최근 배포를 선택하면 영향 분석이 갱신됩니다.">
              <Flex className="items-center justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedVersion(latestVersion)}
                  disabled={!latestVersion}
                >
                  최신 분석
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

            <OpsSectionCard title="영향 분석" description="배포 후 증가한 에러와 이슈를 기준으로 대응 우선순위를 확인합니다.">
              <DeploymentImpactPanel
                impact={impactQuery.data}
                isError={impactQuery.isError}
                isLoading={impactQuery.isLoading}
                selectedVersion={selectedVersion}
              />
            </OpsSectionCard>
          </Grid>
        </Box>

        <Box className="min-w-0">
          <OpsSectionCard
            title="배포 등록"
            description="운영자가 추적할 수 있는 버전명과 변경 요약을 남깁니다."
          >
            <DeploymentRegisterForm
              form={form}
              isSubmitting={createMutation.isPending}
              onSubmit={(values) => createMutation.mutate(values)}
            />
          </OpsSectionCard>
        </Box>
      </Grid>

      <Spinner open={createMutation.isPending} fullscreen size="lg" color="primary" />
    </OpsPageShell>
  );
}
