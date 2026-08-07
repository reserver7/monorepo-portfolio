"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Box, Button, ConsolePageStack, ConsoleSectionCard, Flex, FormField, Grid, Input, Select, SplitWorkspaceLayout, Textarea, Badge, StatCard, Typography, toast } from "@repo/ui";
import { useMutation } from "@repo/react-query";
import { useAppForm } from "@repo/forms";
import { analyzeLogs, createOpsLogTailEventSource, type OpsLogTailEvent } from "@repo/opslens";
import { useOpsFilters } from "@/features/common/stores";
import { formatDateTimeByLocale, resolveServiceLabel } from "@/features/common/utils/ops-display";
import { downloadCsv } from "@/features/common/utils/download-csv";
import { formatNumber } from "@repo/utils";
import { LogAnalysisSidebar, LogClusterResults } from "../components";
import {
  LOGS_DEFAULT_CLUSTER_LIMIT,
  LOGS_SAMPLE,
  LOGS_SAVED_VIEWS_KEY
} from "../constants";
import type { LogsFormValues, LogsSavedView, LogsSavedViewsState, LogsSeverityFilter, LogsSortKey } from "../types";
import {
  createLogsSavedViewId,
  extractCorrelationTokens,
  getAnalyzeErrorMessage,
  getLogsLineCount,
  sortLogClusters
} from "../utils/logs-utils";

export default function LogsPage() {
  const { environment, locale, serviceName } = useOpsFilters();
  const searchParams = useSearchParams();
  const tService = useTranslations("service");
  const [operatorRole, setOperatorRole] = useState<"admin" | "operator" | "viewer">("admin");
  const [clusters, setClusters] = useState<Awaited<ReturnType<typeof analyzeLogs>>["clusters"]>([]);
  const [summary, setSummary] = useState<{ createdIssues: number; updatedIssues: number } | null>(null);
  const [clusterMeta, setClusterMeta] = useState<{ totalCount: number; displayedCount: number } | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [analyzedAt, setAnalyzedAt] = useState<Date | null>(null);
  const [severityFilter, setSeverityFilter] = useState<LogsSeverityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<LogsSortKey>("countDesc");
  const [savedViewsState, setSavedViewsState] = useState<LogsSavedViewsState>({ items: [], activeId: null });
  const [selectedClusterKey, setSelectedClusterKey] = useState<string | null>(null);
  const [liveTailEnabled, setLiveTailEnabled] = useState(false);
  const [liveTailPaused, setLiveTailPaused] = useState(false);
  const [dismissedCorrelationKeys, setDismissedCorrelationKeys] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);
  const lastSubmittedRef = useRef<LogsFormValues | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = window.localStorage.getItem("opslens.role");
    if (role === "viewer" || role === "operator" || role === "admin") {
      setOperatorRole(role);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(LOGS_SAVED_VIEWS_KEY) ?? "[]");
      if (Array.isArray(parsed)) {
        const normalized = parsed.filter((item): item is LogsSavedView => (
          typeof item?.id === "string" &&
          typeof item?.name === "string" &&
          typeof item?.severity === "string" &&
          typeof item?.query === "string" &&
          typeof item?.sort === "string"
        ));
        setSavedViewsState((prev) => ({ ...prev, items: normalized }));
      }
    } catch {
      setSavedViewsState((prev) => ({ ...prev, items: [] }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOGS_SAVED_VIEWS_KEY, JSON.stringify(savedViewsState.items));
  }, [savedViewsState.items]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        queryInputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const form = useAppForm<LogsFormValues>({
    defaultValues: {
      source: "server",
      serviceName: serviceName === "all" ? "docs" : serviceName,
      deploymentVersion: "",
      rawLogs: ""
    }
  });
  const watchedSource = form.watch("source");

  useEffect(() => {
    const targetService = searchParams.get("service");
    const targetDeployment = searchParams.get("deployment");
    if (targetService) form.setValue("serviceName", targetService);
    if (targetDeployment) form.setValue("deploymentVersion", targetDeployment);
  }, [form, searchParams]);

  useEffect(() => {
    if (!liveTailEnabled) return;
    const eventSource = createOpsLogTailEventSource({
      environment,
      serviceName,
      source: watchedSource
    });

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as OpsLogTailEvent;
        if (liveTailPaused) return;
        const line = `${payload.occurredAt} ${payload.level.toUpperCase()} ${payload.source} ${payload.rawMessage}`;
        const current = form.getValues("rawLogs");
        const merged = current.trim().length === 0 ? line : `${current}\n${line}`;
        form.setValue("rawLogs", merged, { shouldDirty: true });
      } catch {
        // noop
      }
    };
    eventSource.onerror = () => {
      toast.warning("Live Tail 연결이 일시적으로 끊겼습니다.");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [environment, form, liveTailEnabled, liveTailPaused, serviceName, watchedSource]);

  const analyzeMutation = useMutation({
    mutationFn: (values: LogsFormValues) =>
      analyzeLogs({
        rawLogs: values.rawLogs,
        source: values.source,
        environment,
        serviceName: values.serviceName,
        deploymentVersion: values.deploymentVersion || undefined,
        clusterLimit: LOGS_DEFAULT_CLUSTER_LIMIT,
        requestedBy: `${operatorRole}:opslens-web/logs-page`
      }),
    retry: 2,
    retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 2400),
    onSuccess: (result) => {
      setClusters(result.clusters);
      setSelectedClusterKey(result.clusters[0]?.normalizedMessage ?? null);
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
  const rawLineCount = getLogsLineCount(rawLogsValue);
  const totalClusterCount = clusters.reduce((acc, cluster) => acc + cluster.count, 0);
  const serviceLabel = resolveServiceLabel(serviceName, tService);
  const analyzedAtLabel = analyzedAt ? formatDateTimeByLocale(analyzedAt.toISOString(), locale) : "-";
  const correlationTokens = useMemo(() => {
    return extractCorrelationTokens(rawLogsValue);
  }, [rawLogsValue]);
  const visibleCorrelationTokens = useMemo(
    () => correlationTokens.filter((token) => !dismissedCorrelationKeys.includes(`${token.key}:${token.value}`)),
    [correlationTokens, dismissedCorrelationKeys]
  );
  const filteredClusters = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const bySeverity = severityFilter === "all"
      ? clusters
      : clusters.filter((cluster) => cluster.severity === severityFilter);
    const byKeyword = keyword.length === 0
      ? bySeverity
      : bySeverity.filter((cluster) =>
          `${cluster.title} ${cluster.normalizedMessage} ${cluster.suggestedActions.join(" ")}`
            .toLowerCase()
            .includes(keyword)
        );

    return sortLogClusters(byKeyword, sortKey);
  }, [clusters, searchQuery, severityFilter, sortKey]);

  const selectedCluster = useMemo(
    () => filteredClusters.find((cluster) => cluster.normalizedMessage === selectedClusterKey) ?? filteredClusters[0] ?? null,
    [filteredClusters, selectedClusterKey]
  );

  const saveCurrentView = () => {
    const baseName = `View ${savedViewsState.items.length + 1}`;
    const nextId = createLogsSavedViewId();
    const next: LogsSavedView = {
      id: nextId,
      name: baseName,
      severity: severityFilter,
      query: searchQuery,
      sort: sortKey
    };
    setSavedViewsState((prev) => ({
      items: [next, ...prev.items].slice(0, 8),
      activeId: nextId
    }));
    toast.success("현재 필터 구성을 저장했습니다.");
  };

  const removeSavedView = (id: string) => {
    setSavedViewsState((prev) => ({
      items: prev.items.filter((view) => view.id !== id),
      activeId: prev.activeId === id ? null : prev.activeId
    }));
  };

  const clearSavedViews = () => {
    setSavedViewsState({ items: [], activeId: null });
    toast.success("저장된 뷰를 모두 삭제했습니다.");
  };

  const applySavedView = (id: string) => {
    const target = savedViewsState.items.find((view) => view.id === id);
    if (!target) return;
    setSeverityFilter(target.severity);
    setSearchQuery(target.query);
    setSortKey(target.sort);
    setSavedViewsState((prev) => ({ ...prev, activeId: id }));
  };

  const runAnalyze = (values: LogsFormValues) => {
    if (operatorRole === "viewer") {
      toast.error("viewer 권한에서는 로그 분석을 실행할 수 없습니다.");
      return;
    }
    lastSubmittedRef.current = values;
    analyzeMutation.mutate(values);
  };

  const createIssueFromCluster = () => {
    if (!selectedCluster) return;
    toast.success(`이슈 생성 요청: ${selectedCluster.title}`);
  };

  const exportClusters = () => {
    downloadCsv(
      `opslens-log-clusters-${new Date().toISOString().slice(0, 10)}.csv`,
      ["제목", "심각도", "발생 횟수", "최초 발생", "최근 발생", "영향 영역", "정규화 메시지"],
      filteredClusters.map((cluster) => [cluster.title, cluster.severity, cluster.count, cluster.firstSeen, cluster.lastSeen, cluster.affectedArea, cluster.normalizedMessage])
    );
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
            <Button type="button" variant="secondary" size="sm" onClick={exportClusters} disabled={filteredClusters.length === 0}>
              CSV 내보내기
            </Button>
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
                        <Badge size="sm" variant={liveTailEnabled ? "info" : "outline"}>Live Tail {liveTailEnabled ? liveTailPaused ? "Paused" : "On" : "Off"}</Badge>
                      </Flex>
                      <Flex className="items-center gap-[var(--space-1-5)]">
                        <Button
                          type="button"
                          variant={liveTailEnabled ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => { setLiveTailEnabled((prev) => !prev); setLiveTailPaused(false); }}
                        >
                          {liveTailEnabled ? "Live Tail 중지" : "Live Tail 시작"}
                        </Button>
                        {liveTailEnabled ? <Button type="button" variant="ghost" size="sm" onClick={() => setLiveTailPaused((prev) => !prev)}>{liveTailPaused ? "수신 재개" : "수신 일시정지"}</Button> : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => form.setValue("rawLogs", LOGS_SAMPLE, { shouldDirty: true })}
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
                    {visibleCorrelationTokens.length > 0 ? (
                      <Flex className="flex-wrap items-center gap-[var(--space-1-5)]">
                        {visibleCorrelationTokens.map((token) => {
                          const key = `${token.key}:${token.value}`;
                          return (
                            <Badge
                              key={key}
                              size="sm"
                              variant="secondary"
                              interactive
                              removable
                              onClick={() => setSearchQuery(token.value)}
                              onRemove={() => setDismissedCorrelationKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))}
                              removeLabel="토큰 숨기기"
                              className="cursor-pointer"
                            >
                              {token.key}:{token.value}
                            </Badge>
                          );
                        })}
                        <Badge
                          size="sm"
                          variant="outline"
                          interactive
                          onClick={() => setDismissedCorrelationKeys([])}
                          className="cursor-pointer"
                        >
                          숨김 해제
                        </Badge>
                      </Flex>
                    ) : null}
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

            <LogClusterResults
              clusters={filteredClusters}
              clusterMeta={clusterMeta}
              error={analyzeMutation.error}
              isError={analyzeMutation.isError}
              isPending={analyzeMutation.isPending}
              lastSubmitted={lastSubmittedRef.current}
              queryInputRef={queryInputRef}
              savedViewsState={savedViewsState}
              searchQuery={searchQuery}
              selectedCluster={selectedCluster}
              severityFilter={severityFilter}
              sortKey={sortKey}
              onApplySavedView={applySavedView}
              onClearSavedViews={clearSavedViews}
              onRemoveSavedView={removeSavedView}
              onRetry={runAnalyze}
              onSaveCurrentView={saveCurrentView}
              onSearchQueryChange={setSearchQuery}
              onSelectCluster={setSelectedClusterKey}
              onSeverityFilterChange={setSeverityFilter}
              onSortKeyChange={setSortKey}
              resolveErrorMessage={getAnalyzeErrorMessage}
            />
          </Box>
        }
        sidebar={<LogAnalysisSidebar selectedCluster={selectedCluster} summary={summary} onCreateIssue={createIssueFromCluster} />}
      />

    </ConsolePageStack>
  );
}
