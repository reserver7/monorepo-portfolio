"use client";

import { useMemo, useState } from "react";
import { Box, Button, Flex, FormField, Grid, Input, Spinner, SplitWorkspaceLayout, StateView, Textarea } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { useAppForm } from "@repo/forms";
import { getDeploymentImpact, getDeployments, registerDeployment } from "@repo/opslens";
import { OpsCardListSkeleton, OpsInfoItem, OpsPageShell, OpsSectionCard, SeverityBadge } from "@/features";
import { useOpsFilters } from "@/features/stores";
import { formatDateTime, formatNumber } from "@repo/utils";
import { opslensQueryKeys } from "@repo/opslens";

type DeploymentFormValues = {
  version: string;
  changelog: string;
};

export default function DeploymentsPage() {
  const { environment } = useOpsFilters();
  const queryClient = useQueryClient();

  const form = useAppForm<DeploymentFormValues>({
    defaultValues: {
      version: "",
      changelog: ""
    }
  });

  const deploymentsQuery = useQuery({
    queryKey: opslensQueryKeys.deployments(environment),
    staleTime: 10 * 1000,
    queryFn: () => getDeployments(environment)
  });

  const latestVersion = useMemo(() => deploymentsQuery.data?.[0]?.version, [deploymentsQuery.data]);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);

  const impactQuery = useQuery({
    queryKey: opslensQueryKeys.deploymentImpact(environment, selectedVersion),
    staleTime: 10 * 1000,
    queryFn: () => getDeploymentImpact(selectedVersion!, environment),
    enabled: Boolean(selectedVersion)
  });

  const createMutation = useMutation({
    mutationFn: (values: DeploymentFormValues) =>
      registerDeployment({
        version: values.version.trim(),
        changelog: values.changelog.trim(),
        environment
      }),
    onSuccess: async (deployment) => {
      setSelectedVersion(deployment.version);
      form.reset({ version: "", changelog: "" });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.deployments(environment) });
    }
  });

  return (
    <OpsPageShell>
      <SplitWorkspaceLayout
        sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_360px]"
        main={
          <Grid className="gap-[var(--space-6)] xl:grid-cols-2">
            <OpsSectionCard title="최근 배포 이력">
              <Flex className="items-center justify-end gap-[var(--space-2)]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVersion(latestVersion)}
                  disabled={!latestVersion}
                >
                  최신 버전 분석
                </Button>
              </Flex>

              {deploymentsQuery.isLoading ? (
                <OpsCardListSkeleton count={5} />
              ) : deploymentsQuery.isError ? (
                <StateView variant="error" size="sm" title="배포 이력 조회에 실패했습니다." className="mt-[var(--space-3)]" />
              ) : (deploymentsQuery.data?.length ?? 0) === 0 ? (
                <StateView variant="empty" size="sm" title="등록된 배포가 없습니다." className="mt-[var(--space-3)]" />
              ) : (
                <Box className="mt-[var(--space-3)] space-y-[var(--space-2)]">
                  {deploymentsQuery.data?.map((deployment) => {
                    const selected = selectedVersion === deployment.version;
                    return (
                      <Button
                        key={deployment.id}
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedVersion(deployment.version)}
                        className={`h-auto w-full justify-start rounded-xl p-[var(--space-3)] text-left ${
                          selected ? "border-info/40 bg-info/10" : "border-default bg-surface"
                        }`}
                      >
                        <Box as="p" className="text-foreground font-semibold">{deployment.version}</Box>
                        <Box as="p" className="text-muted mt-[var(--space-1)] text-caption">{formatDateTime(deployment.deployedAt)}</Box>
                        <Box as="p" className="text-muted mt-[var(--space-1)] line-clamp-2 text-caption">{deployment.changelog}</Box>
                      </Button>
                    );
                  })}
                </Box>
              )}
            </OpsSectionCard>

            <OpsSectionCard title="배포 영향 분석">
              {!selectedVersion ? (
                <StateView variant="info" size="sm" title="분석할 버전을 선택해 주세요." className="mt-[var(--space-3)]" />
              ) : impactQuery.isLoading ? (
                <StateView
                  variant="loading"
                  size="sm"
                  className="border-default bg-surface-elevated rounded-xl border p-[var(--space-4)]"
                  title="선택한 배포 버전 기준으로 영향도를 계산하는 중입니다."
                />
              ) : impactQuery.isError || !impactQuery.data ? (
                <StateView variant="error" size="sm" title="영향 분석에 실패했습니다." className="mt-[var(--space-3)]" />
              ) : (
                <Box className="mt-[var(--space-3)] space-y-[var(--space-3)] text-sm">
                  <Grid className="gap-[var(--space-3)] md:grid-cols-2">
                    <OpsInfoItem label="배포 버전" value={impactQuery.data.version} />
                    <OpsInfoItem label="배포 시각" value={formatDateTime(impactQuery.data.deployedAt)} />
                    <OpsInfoItem
                      label="증가 이슈 수"
                      value={`${formatNumber(impactQuery.data.increasedIssueCount)}건`}
                    />
                    <OpsInfoItem
                      label="배포 후 총 에러 이벤트"
                      value={`${formatNumber(impactQuery.data.totalAfterErrorCount)}건`}
                    />
                  </Grid>

                  <Box as="p" className="border-default bg-surface-elevated text-muted rounded-lg border p-[var(--space-3)]">
                    {impactQuery.data.summary}
                  </Box>

                  {impactQuery.data.increasedIssues.length === 0 ? (
                    <StateView variant="empty" size="sm" title="증가한 이슈가 없습니다." />
                  ) : (
                    <Box className="space-y-[var(--space-2)]">
                      {impactQuery.data.increasedIssues.map((item) => (
                        <Box key={item.issueId} className="border-default rounded-lg border p-[var(--space-3)]">
                          <Box as="p" className="text-foreground font-semibold">{item.title}</Box>
                          <Flex className="text-muted mt-[var(--space-1)] flex-wrap items-center gap-[var(--space-2)] text-caption">
                            <SeverityBadge severity={item.severity} />
                            <Box as="span">{item.serviceName}</Box>
                            <Box as="span">·</Box>
                            <Box as="span">
                              배포 전 {item.beforeCount} / 배포 후 {item.afterCount} (Δ {item.delta})
                            </Box>
                          </Flex>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </OpsSectionCard>
          </Grid>
        }
        sidebar={
          <OpsSectionCard
            title="배포 등록"
            description="배포 버전을 등록하면 배포 전/후 에러 증감 분석이 가능합니다."
          >
            <form className="grid gap-[var(--space-3)]" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <FormField label="배포 버전" htmlFor="deployment-version" size="sm">
                <Input
                  id="deployment-version"
                  {...form.register("version", { required: true })}
                  placeholder="예: 2026.03.25-hotfix.1"
                  size="md"
                />
              </FormField>

              <FormField label="변경 요약" htmlFor="deployment-changelog" size="sm">
                <Textarea
                  id="deployment-changelog"
                  {...form.register("changelog", { required: true })}
                  rows={3}
                  placeholder="결제 모듈 null-safe 처리 및 세션 토큰 검증 로직 개선"
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                className="w-fit"
                loading={createMutation.isPending ? true : undefined}
              >
                배포 등록
              </Button>
            </form>
          </OpsSectionCard>
        }
      />

      <Spinner open={createMutation.isPending} fullscreen size="lg" color="primary" />
    </OpsPageShell>
  );
}
