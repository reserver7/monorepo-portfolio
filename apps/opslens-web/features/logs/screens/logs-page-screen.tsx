"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Button, ConsolePageStack, ConsoleSectionCard, Flex, FormField, Grid, Input, Select, SplitWorkspaceLayout, StateView, Textarea, Badge, StatCard, Typography, toast } from "@repo/ui";
import { useMutation } from "@repo/react-query";
import { useAppForm } from "@repo/forms";
import { analyzeLogs } from "@repo/opslens";
import { useOpsFilters } from "@/features/stores";
import { formatDateTime, formatNumber } from "@repo/utils";

type FormValues = {
  source: "server" | "client" | "api" | "console" | "sentry";
  serviceName: string;
  deploymentVersion?: string;
  rawLogs: string;
};

const severityVariantMap = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "success"
} as const;

const DEFAULT_CLUSTER_LIMIT = 12;

const getAnalyzeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    if (error.message.toLowerCase().includes("network")) {
      return "네트워크 상태를 확인한 뒤 다시 시도하세요.";
    }
    return error.message;
  }
  return "로그 분석에 실패했습니다.";
};

export default function LogsPage() {
  const { environment, serviceName } = useOpsFilters();
  const tService = useTranslations("service");
  const [operatorRole, setOperatorRole] = useState<"admin" | "operator" | "viewer">("admin");
  const [clusters, setClusters] = useState<Awaited<ReturnType<typeof analyzeLogs>>["clusters"]>([]);
  const [summary, setSummary] = useState<{ createdIssues: number; updatedIssues: number } | null>(null);
  const [clusterMeta, setClusterMeta] = useState<{ totalCount: number; displayedCount: number } | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [analyzedAt, setAnalyzedAt] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSubmittedRef = useRef<FormValues | null>(null);
  const sampleLogs = `2026-03-25T10:14:11Z ERROR checkout-api Payment timeout while calling gateway
2026-03-25T10:14:43Z ERROR checkout-api Payment timeout while calling gateway
2026-03-25T10:15:05Z WARN docs-api Permission loop detected for document ACL
2026-03-25T10:16:02Z ERROR ui-shell Cannot read properties of undefined (reading 'id')`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = window.localStorage.getItem("opslens.role");
    if (role === "viewer" || role === "operator" || role === "admin") {
      setOperatorRole(role);
    }
  }, []);

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
        deploymentVersion: values.deploymentVersion || undefined,
        clusterLimit: DEFAULT_CLUSTER_LIMIT,
        requestedBy: `${operatorRole}:opslens-web/logs-page`
      }),
    retry: 2,
    retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 2400),
    onSuccess: (result) => {
      setClusters(result.clusters);
      setClusterMeta({ totalCount: result.clusterTotalCount, displayedCount: result.clusterDisplayedCount });
      setSummary({ createdIssues: result.createdIssues, updatedIssues: result.updatedIssues });
      setAnalyzedAt(new Date());
      toast.success("로그 분석이 완료되었습니다.");
    },
    onError: (error) => {
      toast.error(getAnalyzeErrorMessage(error));
    }
  });

  const handleUploadFile: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    form.setValue("rawLogs", text, { shouldDirty: true });
    setUploadedFileName(file.name);
  };

  const rawLogsValue = form.watch("rawLogs");
  const rawLineCount = rawLogsValue.trim().length === 0 ? 0 : rawLogsValue.split("\n").filter((line) => line.trim().length > 0).length;
  const totalClusterCount = clusters.reduce((acc, cluster) => acc + cluster.count, 0);
  const serviceLabel = serviceName === "all"
    ? tService("all")
    : serviceName === "docs"
      ? tService("docs")
      : serviceName === "whiteboard"
        ? tService("whiteboard")
        : serviceName === "billing"
          ? tService("billing")
          : serviceName === "checkout"
            ? tService("checkout")
            : serviceName;
  const analyzedAtLabel = analyzedAt ? formatDateTime(analyzedAt.toISOString()) : "-";
  const runAnalyze = (values: FormValues) => {
    if (operatorRole === "viewer") {
      toast.error("viewer 권한에서는 로그 분석을 실행할 수 없습니다.");
      return;
    }
    lastSubmittedRef.current = values;
    analyzeMutation.mutate(values);
  };

  return (
    <ConsolePageStack>
      <Box className="border-default bg-surface rounded-[var(--radius-xl)] border px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-5)]">
        <Flex className="items-center justify-between gap-[var(--space-3)]">
          <Typography as="h2" variant="headingMd" className="tracking-[-0.01em]">로그 운영 분석</Typography>
          <Flex className="flex-wrap items-center gap-[var(--space-2)]">
            <Typography as="p" variant="caption" color="subtle" className="mr-[var(--space-1)]">
              최근 분석: {analyzedAtLabel}
            </Typography>
            <Badge variant="secondary" size="sm">서비스: {serviceLabel}</Badge>
          </Flex>
        </Flex>
      </Box>

      <SplitWorkspaceLayout
        sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_372px]"
        main={
          <Box className="space-y-[var(--stack-gap)]">
            <ConsoleSectionCard
              title="로그 입력 및 분석"
              description="운영 로그를 그룹핑해 이슈 후보를 빠르게 정리합니다."
              contentClassName="pt-[var(--space-2)]"
            >
              <Box className="grid gap-[var(--space-4)]">
                <Grid className="gap-[var(--space-3)] md:grid-cols-3">
                  <StatCard
                    label="입력 라인"
                    value={formatNumber(rawLineCount)}
                    helper="현재 입력 기준"
                    size="sm"
                    className="h-full rounded-[var(--radius-lg)]"
                  />
                  <StatCard
                    label="클러스터"
                    value={formatNumber(clusters.length)}
                    helper="분석 결과 그룹 수"
                    size="sm"
                    color="primary"
                    className="h-full rounded-[var(--radius-lg)]"
                  />
                  <StatCard
                    label="총 이벤트"
                    value={formatNumber(totalClusterCount)}
                    helper="클러스터 합계"
                    size="sm"
                    color="warning"
                    className="h-full rounded-[var(--radius-lg)]"
                  />
                </Grid>

                <Grid className="gap-[var(--space-3)] md:grid-cols-3">
                  <FormField label="로그 소스" htmlFor="logs-source" size="sm">
                    <Select
                      options={[
                        { label: "Server", value: "server" },
                        { label: "Client", value: "client" },
                        { label: "API", value: "api" },
                        { label: "Console", value: "console" },
                        { label: "Sentry", value: "sentry" }
                      ]}
                      control={form.control}
                      name="source"
                      size="md"
                    />
                  </FormField>

                  <FormField label="서비스" htmlFor="logs-service-name" size="sm">
                    <Select
                      options={[
                        { label: tService("docs"), value: "docs" },
                        { label: tService("whiteboard"), value: "whiteboard" },
                        { label: tService("billing"), value: "billing" },
                        { label: tService("checkout"), value: "checkout" }
                      ]}
                      control={form.control}
                      name="serviceName"
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
                  <Box className="space-y-[var(--space-2)]">
                    <Textarea
                      id="logs-raw-message"
                      rows={11}
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
                    <Flex className="items-center justify-between gap-[var(--space-2)]">
                      <Flex className="items-center gap-[var(--space-1-5)]">
                        <Badge size="sm" variant="secondary">라인 {formatNumber(rawLineCount)}</Badge>
                        {uploadedFileName ? <Badge size="sm" variant="outline">{uploadedFileName}</Badge> : null}
                      </Flex>
                      <Flex className="items-center gap-[var(--space-1-5)]">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => form.setValue("rawLogs", sampleLogs, { shouldDirty: true })}
                          disabled={analyzeMutation.isPending}
                        >
                          샘플 넣기
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setValue("rawLogs", "", { shouldDirty: true });
                            setUploadedFileName("");
                            setClusters([]);
                            setClusterMeta(null);
                            setSummary(null);
                          }}
                          disabled={analyzeMutation.isPending}
                        >
                          초기화
                        </Button>
                      </Flex>
                    </Flex>
                  </Box>
                </FormField>

                <Flex className="flex-wrap items-center gap-[var(--space-2)]">
                  <Button
                    type="button"
                    variant="primary"
                    loading={analyzeMutation.isPending ? true : undefined}
                    loadingLabel="로그 분석 중..."
                    disabled={operatorRole === "viewer"}
                    onClick={form.handleSubmit(runAnalyze)}
                  >
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
              </Box>
            </ConsoleSectionCard>

            <ConsoleSectionCard title="분석 결과 클러스터" description="중복 패턴과 심각도를 기준으로 정리된 결과입니다.">
              {clusterMeta ? (
                <Flex className="mb-[var(--space-2)] items-center gap-[var(--space-1-5)]">
                  <Badge variant="secondary" size="sm">표시 {formatNumber(clusterMeta.displayedCount)}건</Badge>
                  <Badge variant="outline" size="sm">전체 {formatNumber(clusterMeta.totalCount)}건</Badge>
                </Flex>
              ) : null}
              {analyzeMutation.isError ? (
                <Box className="mb-[var(--space-2)]">
                  <StateView
                    variant="error"
                    size="sm"
                    title={getAnalyzeErrorMessage(analyzeMutation.error)}
                    action={
                      lastSubmittedRef.current ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => runAnalyze(lastSubmittedRef.current as FormValues)}
                          loading={analyzeMutation.isPending ? true : undefined}
                          loadingLabel="재시도 중..."
                        >
                          다시 시도
                        </Button>
                      ) : undefined
                    }
                  />
                </Box>
              ) : null}
              {clusters.length === 0 ? (
                <StateView variant="empty" size="sm" title="분석 결과가 없습니다." />
              ) : (
                <Box className="space-y-[var(--space-2)]">
                  {clusters.map((cluster) => (
                    <Box
                      key={cluster.normalizedMessage}
                      className="border-default bg-surface-elevated rounded-[var(--radius-lg)] border p-[var(--space-3)]"
                    >
                      <Flex className="flex-wrap items-center justify-between gap-[var(--space-2)]">
                        <Typography as="p" variant="bodySm" className="font-semibold">{cluster.title}</Typography>
                        <Flex className="items-center gap-[var(--space-2)]">
                          <Badge variant={severityVariantMap[cluster.severity]} size="sm" className="rounded-md font-semibold">
                            {cluster.severity}
                          </Badge>
                          <Badge size="sm" variant="secondary">{formatNumber(cluster.count)}건</Badge>
                        </Flex>
                      </Flex>
                      <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">{cluster.normalizedMessage}</Typography>
                      <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-2)]">
                        최초 {formatDateTime(cluster.firstSeen)} · 최근 {formatDateTime(cluster.lastSeen)}
                      </Typography>
                      <Box className="mt-[var(--space-2)] space-y-[var(--space-1)]">
                        {cluster.suggestedActions.map((action) => (
                          <Flex key={action} className="items-start gap-[var(--space-1)]">
                            <Box as="span" className="text-muted text-caption">•</Box>
                            <Typography as="p" variant="caption" color="muted">{action}</Typography>
                          </Flex>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </ConsoleSectionCard>
          </Box>
        }
        sidebar={
          summary ? (
            <Box className="space-y-[var(--space-3)]">
              <StatCard
                label="신규 이슈 생성"
                value={`${formatNumber(summary.createdIssues)}건`}
                helper="새로 생성된 항목"
                color="success"
                size="sm"
                className="rounded-[var(--radius-lg)]"
              />
              <StatCard
                label="기존 이슈 업데이트"
                value={`${formatNumber(summary.updatedIssues)}건`}
                helper="기존 항목에 반영"
                color="warning"
                size="sm"
                className="rounded-[var(--radius-lg)]"
              />
            </Box>
          ) : (
            <StateView variant="info" size="sm" title="로그를 분석하면 요약 카드가 표시됩니다." />
          )
        }
      />

    </ConsolePageStack>
  );
}
