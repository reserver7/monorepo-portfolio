"use client";

import { useMemo, useState } from "react";
import { Button, Input, Label, Textarea } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { useForm } from "react-hook-form";
import { getDeploymentImpact, getDeployments, registerDeployment } from "@/lib/api";
import { OpsInfoItem, OpsSectionCard } from "@/components/opslens";
import { useOpsFilterStore } from "@/lib/store";
import { formatDateTime, formatNumber } from "@/lib/utils";

type DeploymentFormValues = {
  version: string;
  changelog: string;
};

export default function DeploymentsPage() {
  const environment = useOpsFilterStore((state) => state.environment);
  const queryClient = useQueryClient();

  const form = useForm<DeploymentFormValues>({
    defaultValues: {
      version: "",
      changelog: ""
    }
  });

  const deploymentsQuery = useQuery({
    queryKey: ["opslens", "deployments", environment],
    queryFn: () => getDeployments(environment)
  });

  const latestVersion = useMemo(() => deploymentsQuery.data?.[0]?.version, [deploymentsQuery.data]);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);

  const impactQuery = useQuery({
    queryKey: ["opslens", "deployment-impact", environment, selectedVersion],
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
      await queryClient.invalidateQueries({ queryKey: ["opslens", "deployments", environment] });
    }
  });

  return (
    <div className="space-y-5">
      <OpsSectionCard title="배포 등록" description="배포 버전을 등록하면 배포 전/후 에러 증감 분석이 가능합니다.">

        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="deployment-version">배포 버전</Label>
            <Input
              id="deployment-version"
              {...form.register("version", { required: true })}
              placeholder="예: 2026.03.25-hotfix.1"
            />
          </div>

          <div className="grid gap-1 text-sm">
            <Label htmlFor="deployment-changelog">변경 요약</Label>
            <Textarea
              id="deployment-changelog"
              {...form.register("changelog", { required: true })}
              rows={3}
              placeholder="결제 모듈 null-safe 처리 및 세션 토큰 검증 로직 개선"
            />
          </div>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-fit bg-primary hover:opacity-90"
          >
            {createMutation.isPending ? "등록 중..." : "배포 등록"}
          </Button>
        </form>
      </OpsSectionCard>

      <section className="grid gap-5 xl:grid-cols-2">
        <OpsSectionCard title="최근 배포 이력">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVersion(latestVersion)}
              disabled={!latestVersion}
            >
              최신 버전 분석
            </Button>
          </div>

          {deploymentsQuery.isLoading ? (
            <p className="mt-3 text-sm text-muted">배포 이력을 불러오는 중...</p>
          ) : deploymentsQuery.isError ? (
            <p className="mt-3 text-sm text-danger">배포 이력 조회에 실패했습니다.</p>
          ) : (deploymentsQuery.data?.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-muted">등록된 배포가 없습니다.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {deploymentsQuery.data?.map((deployment) => {
                const selected = selectedVersion === deployment.version;
                return (
                  <Button
                    key={deployment.id}
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedVersion(deployment.version)}
                    className={`h-auto w-full justify-start rounded-lg p-3 text-left ${
                      selected ? "border-primary/40 bg-primary/10" : "border-default bg-surface"
                    }`}
                  >
                    <p className="font-semibold text-foreground">{deployment.version}</p>
                    <p className="mt-1 text-xs text-muted">{formatDateTime(deployment.deployedAt)}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{deployment.changelog}</p>
                  </Button>
                );
              })}
            </div>
          )}
        </OpsSectionCard>

        <OpsSectionCard title="배포 영향 분석">
          {!selectedVersion ? (
            <p className="mt-3 text-sm text-muted">분석할 버전을 선택해 주세요.</p>
          ) : impactQuery.isLoading ? (
            <p className="mt-3 text-sm text-muted">영향 분석 중...</p>
          ) : impactQuery.isError || !impactQuery.data ? (
            <p className="mt-3 text-sm text-danger">영향 분석에 실패했습니다.</p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <OpsInfoItem label="배포 버전" value={impactQuery.data.version} />
                <OpsInfoItem label="배포 시각" value={formatDateTime(impactQuery.data.deployedAt)} />
                <OpsInfoItem label="증가 이슈 수" value={`${formatNumber(impactQuery.data.increasedIssueCount)}건`} />
                <OpsInfoItem label="배포 후 총 에러 이벤트" value={`${formatNumber(impactQuery.data.totalAfterErrorCount)}건`} />
              </div>

              <p className="rounded-lg border border-default bg-surface-elevated p-3 text-muted">{impactQuery.data.summary}</p>

              {impactQuery.data.increasedIssues.length === 0 ? (
                <p className="text-muted">증가한 이슈가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {impactQuery.data.increasedIssues.map((item) => (
                    <div key={item.issueId} className="rounded-lg border border-default p-3">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {item.serviceName} · {item.severity} · 배포 전 {item.beforeCount} / 배포 후 {item.afterCount} (Δ {item.delta})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </OpsSectionCard>
      </section>
    </div>
  );
}
