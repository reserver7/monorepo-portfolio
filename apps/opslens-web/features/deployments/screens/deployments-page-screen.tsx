"use client";

import { useMemo, useState } from "react";
import { Badge, Box, Button, Flex, Grid, Input, StatCard, Textarea, Typography, toast } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { useAppForm } from "@repo/forms";
import { getDeploymentImpact, getDeploymentReadiness, getDeployments, opslensQueryKeys, registerDeployment, updateDeploymentDecision } from "@repo/opslens";
import { OpsPageShell, OpsSectionCard } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsPermissions } from "@/features/common/hooks/use-ops-permissions";
import { useOpsFilters } from "@/features/common/stores";
import { formatNumber } from "@repo/utils";
import { DeploymentHistoryList, DeploymentImpactPanel, DeploymentRegisterForm } from "../components";
import { DEPLOYMENT_FORM_DEFAULT_VALUES } from "../constants";
import type { DeploymentFormValues } from "../types";

export default function DeploymentsPage() {
  const { environment } = useOpsFilters();
  const queryClient = useQueryClient();
  const { canOperate } = useOpsPermissions();

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
  const [decisionActor, setDecisionActor] = useState("");
  const [decisionReason, setDecisionReason] = useState("");

  const impactQuery = useQuery(useOpsQueryOptions("default", {
    queryKey: opslensQueryKeys.deploymentImpact(environment, selectedVersion),
    queryFn: () => getDeploymentImpact(selectedVersion!, environment),
    enabled: Boolean(selectedVersion)
  }));
  const readinessQuery = useQuery(useOpsQueryOptions("default", {
    queryKey: opslensQueryKeys.deploymentReadiness(environment),
    queryFn: () => getDeploymentReadiness(environment)
  }));

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
    mutationFn: (decision: "approved" | "rejected" | "rollback_requested" | "rolled_back") => updateDeploymentDecision({ deploymentId: selectedDeployment!.id, decision, approver: decision === "approved" || decision === "rejected" ? decisionActor : undefined, reason: decision === "rollback_requested" || decision === "rolled_back" ? decisionReason : undefined }),
    onSuccess: async () => {
      setDecisionReason("");
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.deployments(environment) });
      toast.success("배포 결정을 기록했습니다.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "배포 결정을 저장하지 못했습니다.")
  });

  return (
    <OpsPageShell>
      <Box className="border-default bg-surface rounded-[var(--radius-xl)] border px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-5)]">
        <Flex className="flex-col items-stretch justify-between gap-[var(--space-3)] sm:flex-row sm:items-center">
          <Box className="min-w-0">
            <Typography as="h2" variant="headingMd" className="tracking-[-0.01em]">
              배포 운영
            </Typography>
          </Box>
          <Flex className="shrink-0 flex-wrap justify-start gap-[var(--space-2)] sm:justify-end">
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

      {readinessQuery.data ? (
        <OpsSectionCard title="배포 전 게이트" description="미해결 운영 이슈를 기준으로 배포 전 확인이 필요한 항목입니다.">
          <Flex className="flex-wrap items-start justify-between gap-[var(--space-3)]">
            <Flex className="flex-wrap items-center gap-[var(--space-2)]">
              <Badge size="sm" variant={readinessQuery.data.status === "blocked" ? "danger" : readinessQuery.data.status === "approval_required" ? "warning" : "success"}>
                {readinessQuery.data.status === "blocked" ? "배포 차단" : readinessQuery.data.status === "approval_required" ? "승인 필요" : "배포 가능"}
              </Badge>
              <Typography as="p" variant="caption" color="muted">Critical/High {readinessQuery.data.criticalHighCount} · 미지정 {readinessQuery.data.unassignedCount}</Typography>
            </Flex>
            <Box className="min-w-0 flex-1 xl:max-w-[720px]">
              {readinessQuery.data.recommendations.map((recommendation) => <Typography key={recommendation} as="p" variant="caption" color="muted" className="mb-[var(--space-1)]">• {recommendation}</Typography>)}
            </Box>
          </Flex>
        </OpsSectionCard>
      ) : null}

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

            {selectedDeployment ? <OpsSectionCard title="승인 및 롤백 기록" description="승인자, CI 링크, 롤백 판단을 배포 이력에 남깁니다.">
              <Box className="space-y-[var(--space-3)]">
                <Flex className="flex-wrap gap-[var(--space-2)]"><Badge size="sm" variant={selectedDeployment.approvalStatus === "approved" ? "success" : selectedDeployment.approvalStatus === "rejected" ? "danger" : "secondary"}>승인 {selectedDeployment.approvalStatus}</Badge><Badge size="sm" variant={selectedDeployment.rollbackStatus === "rolled_back" ? "danger" : selectedDeployment.rollbackStatus === "rollback_requested" ? "warning" : "secondary"}>롤백 {selectedDeployment.rollbackStatus}</Badge></Flex>
                {selectedDeployment.ciUrl ? <Button asChild variant="outline" size="sm"><a href={selectedDeployment.ciUrl} target="_blank" rel="noreferrer">CI / 배포 실행 보기</a></Button> : null}
                {canOperate ? <><Input label="승인/반려자" value={decisionActor} onChange={(event) => setDecisionActor(event.target.value)} placeholder="예: tech-lead@company.com" /><Flex className="flex-wrap gap-[var(--space-2)]"><Button type="button" size="sm" variant="secondary" loading={decisionMutation.isPending} disabled={!decisionActor.trim()} onClick={() => decisionMutation.mutate("approved")}>승인 기록</Button><Button type="button" size="sm" variant="outline" loading={decisionMutation.isPending} disabled={!decisionActor.trim()} onClick={() => decisionMutation.mutate("rejected")}>반려 기록</Button></Flex><Textarea label="롤백 사유" value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} rows={2} placeholder="예: 결제 오류 증가로 이전 안정 버전으로 복구" /><Flex className="flex-wrap gap-[var(--space-2)]"><Button type="button" size="sm" variant="secondary" loading={decisionMutation.isPending} disabled={!decisionReason.trim()} onClick={() => decisionMutation.mutate("rollback_requested")}>롤백 요청</Button><Button type="button" size="sm" variant="danger" loading={decisionMutation.isPending} disabled={!decisionReason.trim()} onClick={() => decisionMutation.mutate("rolled_back")}>롤백 완료</Button></Flex></> : null}
              </Box>
            </OpsSectionCard> : null}
          </Grid>
        </Box>

        <Box className="min-w-0">
          <OpsSectionCard
            title="배포 등록"
            description={canOperate ? "운영자가 추적할 수 있는 버전명과 변경 요약을 남깁니다." : "조회 전용 역할에서는 배포를 등록할 수 없습니다."}
          >
            {canOperate ? <DeploymentRegisterForm form={form} isSubmitting={createMutation.isPending} onSubmit={(values) => createMutation.mutate(values)} /> : <Typography as="p" variant="bodySm" color="muted">배포 이력과 영향 분석은 계속 확인할 수 있습니다.</Typography>}
          </OpsSectionCard>
        </Box>
      </Grid>
    </OpsPageShell>
  );
}
