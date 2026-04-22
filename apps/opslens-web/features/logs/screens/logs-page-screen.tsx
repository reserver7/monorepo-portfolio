"use client";

import { useRef, useState } from "react";
import { Box, Button, Flex, FormField, Grid, Input, Select, Spinner, SplitWorkspaceLayout, StateView, Textarea } from "@repo/ui";
import { useMutation } from "@repo/react-query";
import { useAppForm } from "@repo/forms";
import { analyzeLogs } from "@repo/opslens";
import { OpsPageShell, OpsSectionCard, SeverityBadge } from "@/features";
import { useOpsFilters } from "@/features/stores";
import { formatDateTime, formatNumber } from "@repo/utils";

type FormValues = {
  source: "server" | "client" | "api" | "console" | "sentry";
  serviceName: string;
  deploymentVersion?: string;
  rawLogs: string;
};

export default function LogsPage() {
  const { environment, serviceName } = useOpsFilters();
  const [clusters, setClusters] = useState<Awaited<ReturnType<typeof analyzeLogs>>["clusters"]>([]);
  const [summary, setSummary] = useState<{ createdIssues: number; updatedIssues: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useAppForm<FormValues>({
    defaultValues: {
      source: "server",
      serviceName: serviceName === "all" ? "docs" : serviceName,
      deploymentVersion: "",
      rawLogs: ""
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: (values: FormValues) =>
      analyzeLogs({
        rawLogs: values.rawLogs,
        source: values.source,
        environment,
        serviceName: values.serviceName,
        deploymentVersion: values.deploymentVersion || undefined
      }),
    onSuccess: (result) => {
      setClusters(result.clusters);
      setSummary({ createdIssues: result.createdIssues, updatedIssues: result.updatedIssues });
    }
  });

  const handleUploadFile: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    form.setValue("rawLogs", text, { shouldDirty: true });
  };

  return (
    <OpsPageShell>
      <SplitWorkspaceLayout
        sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_320px]"
        main={
          <Box className="space-y-[var(--stack-gap)]">
            <OpsSectionCard
              title="로그 분석"
              description="서버 로그, 콘솔 에러, Sentry JSON을 자동 그룹핑/요약합니다."
            >
              <form className="grid gap-[var(--space-4)]" onSubmit={form.handleSubmit((values) => analyzeMutation.mutate(values))}>
                <Grid className="gap-[var(--space-3)] md:grid-cols-3">
                  <FormField label="로그 소스" htmlFor="logs-source" size="sm">
                    <Select
                      options={[
                        { label: "server", value: "server" },
                        { label: "client", value: "client" },
                        { label: "api", value: "api" },
                        { label: "console", value: "console" },
                        { label: "sentry", value: "sentry" }
                      ]}
                      control={form.control}
                      name="source"
                      size="md"
                    />
                  </FormField>

                  <FormField label="서비스명" htmlFor="logs-service-name" size="sm">
                    <Input
                      id="logs-service-name"
                      {...form.register("serviceName", {
                        required: "서비스명을 입력하세요."
                      })}
                      size="md"
                    />
                  </FormField>

                  <FormField label="배포 버전(선택)" htmlFor="logs-deployment-version" size="sm">
                    <Input id="logs-deployment-version" {...form.register("deploymentVersion")} size="md" />
                  </FormField>
                </Grid>

                <FormField
                  label="로그 원문"
                  htmlFor="logs-raw-message"
                  size="sm"
                  error={form.formState.errors.rawLogs?.message}
                >
                  <Textarea
                    id="logs-raw-message"
                    rows={10}
                    {...form.register("rawLogs", {
                      required: "로그를 입력하세요.",
                      minLength: {
                        value: 10,
                        message: "로그를 10자 이상 입력하세요."
                      }
                    })}
                    className="font-mono text-caption"
                    placeholder="2026-03-25T10:14:11Z ERROR Cannot read properties of undefined at ..."
                  />
                </FormField>

                <Flex className="flex-wrap items-center gap-[var(--space-2)]">
                  <Button type="submit" variant="primary" loading={analyzeMutation.isPending ? true : undefined}>
                    로그 분석 실행
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzeMutation.isPending}
                  >
                    파일 업로드
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.log,.json"
                    className="hidden"
                    onChange={handleUploadFile}
                  />
                </Flex>
              </form>
            </OpsSectionCard>

            <OpsSectionCard title="분석 결과 클러스터">
              {clusters.length === 0 ? (
                <StateView variant="empty" size="sm" title="분석 결과가 없습니다." />
              ) : (
                <Box className="space-y-[var(--space-3)]">
                  {clusters.map((cluster) => (
                    <article key={cluster.normalizedMessage} className="border-default rounded-xl border p-[var(--space-3-5)]">
                      <Flex className="flex-wrap items-center justify-between gap-[var(--space-2)]">
                        <Box as="p" className="text-foreground font-semibold">{cluster.title}</Box>
                        <Flex className="items-center gap-[var(--space-2)]">
                          <SeverityBadge severity={cluster.severity} />
                          <Box as="span" className="text-muted text-caption">{formatNumber(cluster.count)}회</Box>
                        </Flex>
                      </Flex>
                      <Box as="p" className="text-muted mt-[var(--space-1)] text-caption">{cluster.normalizedMessage}</Box>
                      <Box as="p" className="text-muted-foreground mt-[var(--space-2)] text-caption">
                        최초 {formatDateTime(cluster.firstSeen)} · 최근 {formatDateTime(cluster.lastSeen)}
                      </Box>
                      <ul className="text-muted mt-[var(--space-2)] list-disc space-y-[var(--space-1)] pl-[var(--space-5)] text-caption">
                        {cluster.suggestedActions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </Box>
              )}
            </OpsSectionCard>
          </Box>
        }
        sidebar={
          summary ? (
            <Box className="space-y-[var(--space-3)]">
              <StateView
                variant="success"
                size="sm"
                align="left"
                title="신규 이슈 생성"
                description={`${formatNumber(summary.createdIssues)}건`}
              />
              <StateView
                variant="warning"
                size="sm"
                align="left"
                title="기존 이슈 업데이트"
                description={`${formatNumber(summary.updatedIssues)}건`}
              />
            </Box>
          ) : (
            <StateView variant="info" size="sm" title="로그를 분석하면 요약 카드가 표시됩니다." />
          )
        }
      />

      <Spinner open={analyzeMutation.isPending} fullscreen size="lg" color="primary" />
    </OpsPageShell>
  );
}
