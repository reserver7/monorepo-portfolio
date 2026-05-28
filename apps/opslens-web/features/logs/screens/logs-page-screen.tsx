"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Button, ConsolePageStack, ConsoleSectionCard, Flex, FormField, Grid, Input, Select, SplitWorkspaceLayout, StateView, Textarea, Badge, StatCard, Typography, toast } from "@repo/ui";
import { useMutation } from "@repo/react-query";
import { useAppForm } from "@repo/forms";
import { analyzeLogs, createOpsLogTailEventSource, type OpsLogTailEvent } from "@repo/opslens";
import { formatDateTimeByLocale, resolveServiceLabel } from "@/features/utils/ops-display";
import { useOpsFilters } from "@/features/stores";
import { formatDateTime, formatNumber } from "@repo/utils";

type FormValues = {
  source: "server" | "client" | "api" | "console" | "sentry";
  serviceName: string;
  deploymentVersion?: string;
  rawLogs: string;
};

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";
type SortKey = "countDesc" | "latestDesc" | "severityDesc";
type SavedView = {
  id: string;
  name: string;
  severity: SeverityFilter;
  query: string;
  sort: SortKey;
};
type SavedViewsState = {
  items: SavedView[];
  activeId: string | null;
};

type CorrelationToken = {
  key: "traceId" | "requestId";
  value: string;
};

const severityVariantMap = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "success"
} as const;

const DEFAULT_CLUSTER_LIMIT = 12;
const SAVED_VIEWS_KEY = "opslens.logs.savedViews.v1";
const createSavedViewId = (): string => {
  if (typeof globalThis !== "undefined" && "crypto" in globalThis && typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

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
  const { environment, locale, serviceName } = useOpsFilters();
  const tService = useTranslations("service");
  const [operatorRole, setOperatorRole] = useState<"admin" | "operator" | "viewer">("admin");
  const [clusters, setClusters] = useState<Awaited<ReturnType<typeof analyzeLogs>>["clusters"]>([]);
  const [summary, setSummary] = useState<{ createdIssues: number; updatedIssues: number } | null>(null);
  const [clusterMeta, setClusterMeta] = useState<{ totalCount: number; displayedCount: number } | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [analyzedAt, setAnalyzedAt] = useState<Date | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("countDesc");
  const [savedViewsState, setSavedViewsState] = useState<SavedViewsState>({ items: [], activeId: null });
  const [selectedClusterKey, setSelectedClusterKey] = useState<string | null>(null);
  const [liveTailEnabled, setLiveTailEnabled] = useState(false);
  const [dismissedCorrelationKeys, setDismissedCorrelationKeys] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(SAVED_VIEWS_KEY) ?? "[]");
      if (Array.isArray(parsed)) {
        const normalized = parsed.filter((item): item is SavedView => (
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
    window.localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViewsState.items));
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

  const form = useAppForm<FormValues>({
    defaultValues: {
      source: "server",
      serviceName: serviceName === "all" ? "docs" : serviceName,
      deploymentVersion: "",
      rawLogs: ""
    }
  });
  const watchedSource = form.watch("source");

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
  }, [environment, form, liveTailEnabled, serviceName, watchedSource]);

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
  const rawLineCount = rawLogsValue.trim().length === 0 ? 0 : rawLogsValue.split("\n").filter((line) => line.trim().length > 0).length;
  const totalClusterCount = clusters.reduce((acc, cluster) => acc + cluster.count, 0);
  const serviceLabel = resolveServiceLabel(serviceName, tService);
  const analyzedAtLabel = analyzedAt ? formatDateTimeByLocale(analyzedAt.toISOString(), locale) : "-";
  const correlationTokens = useMemo(() => {
    const matches = rawLogsValue.matchAll(/\b(traceId|requestId)=([a-zA-Z0-9_-]+)\b/g);
    const unique = new Map<string, CorrelationToken>();
    for (const match of matches) {
      const key = match[1] as "traceId" | "requestId";
      const value = match[2] ?? "";
      if (value.length === 0) continue;
      const id = `${key}:${value}`;
      if (!unique.has(id)) unique.set(id, { key, value });
      if (unique.size >= 10) break;
    }
    return Array.from(unique.values());
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

    const severityRank: Record<"critical" | "high" | "medium" | "low", number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    return [...byKeyword].sort((a, b) => {
      if (sortKey === "countDesc") return b.count - a.count;
      if (sortKey === "latestDesc") return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      return severityRank[b.severity] - severityRank[a.severity];
    });
  }, [clusters, searchQuery, severityFilter, sortKey]);

  const selectedCluster = useMemo(
    () => filteredClusters.find((cluster) => cluster.normalizedMessage === selectedClusterKey) ?? filteredClusters[0] ?? null,
    [filteredClusters, selectedClusterKey]
  );

  const saveCurrentView = () => {
    const baseName = `View ${savedViewsState.items.length + 1}`;
    const nextId = createSavedViewId();
    const next: SavedView = {
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

  const runAnalyze = (values: FormValues) => {
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
                        <Badge size="sm" variant={liveTailEnabled ? "info" : "outline"}>Live Tail {liveTailEnabled ? "On" : "Off"}</Badge>
                      </Flex>
                      <Flex className="items-center gap-[var(--space-1-5)]">
                        <Button
                          type="button"
                          variant={liveTailEnabled ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setLiveTailEnabled((prev) => !prev)}
                        >
                          {liveTailEnabled ? "Live Tail 중지" : "Live Tail 시작"}
                        </Button>
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

            <ConsoleSectionCard title="분석 결과 클러스터" description="중복 패턴과 심각도를 기준으로 정리된 결과입니다.">
              <Box className="mb-[var(--space-3)]">
                <Grid className="gap-[var(--space-2)] md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
                  <Input
                    ref={queryInputRef}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="클러스터 검색 (/)"
                    size="md"
                  />
                  <Select
                    value={severityFilter}
                    onChange={(value) => setSeverityFilter(String(value) as SeverityFilter)}
                    options={[
                      { label: "심각도: 전체", value: "all" },
                      { label: "Critical", value: "critical" },
                      { label: "High", value: "high" },
                      { label: "Medium", value: "medium" },
                      { label: "Low", value: "low" }
                    ]}
                  />
                  <Select
                    value={sortKey}
                    onChange={(value) => setSortKey(String(value) as SortKey)}
                    options={[
                      { label: "정렬: 발생량", value: "countDesc" },
                      { label: "정렬: 최근순", value: "latestDesc" },
                      { label: "정렬: 심각도", value: "severityDesc" }
                    ]}
                  />
                  <Flex className="items-center justify-end gap-[var(--space-1-5)]">
                    <Button type="button" size="sm" variant="outline" onClick={saveCurrentView}>뷰 저장</Button>
                  </Flex>
                </Grid>
                {savedViewsState.items.length > 0 ? (
                  <Flex className="mt-[var(--space-2)] flex-wrap items-center gap-[var(--space-1-5)]">
                    {savedViewsState.items.map((view) => (
                      <Badge
                        key={view.id}
                        size="sm"
                        variant={savedViewsState.activeId === view.id ? "info" : "secondary"}
                        interactive
                        removable
                        onClick={() => applySavedView(view.id)}
                        onRemove={() => removeSavedView(view.id)}
                        removeLabel={`${view.name} 삭제`}
                        className={`cursor-pointer transition-[background-color,border-color,box-shadow,color] duration-150 ease-out ${
                          savedViewsState.activeId === view.id ? "ring-1 ring-primary/35 shadow-none" : "ring-0 shadow-none"
                        }`}
                      >
                        {view.name}
                      </Badge>
                    ))}
                    <Badge
                      size="sm"
                      variant="outline"
                      interactive
                      onClick={clearSavedViews}
                      className="cursor-pointer"
                    >
                      전체 삭제
                    </Badge>
                  </Flex>
                ) : null}
              </Box>
              {clusterMeta ? (
                <Flex className="mb-[var(--space-2)] items-center gap-[var(--space-1-5)]">
                  <Badge variant="secondary" size="sm">표시 {formatNumber(filteredClusters.length)}건</Badge>
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
              {filteredClusters.length === 0 ? (
                <StateView variant="empty" size="sm" title="분석 결과가 없습니다." />
              ) : (
                <Box className="space-y-[var(--space-2)]">
                  {filteredClusters.map((cluster) => (
                    <Box
                      key={cluster.normalizedMessage}
                      className={`border-default bg-surface rounded-[var(--radius-lg)] border p-[var(--space-3)] ${
                        selectedCluster?.normalizedMessage === cluster.normalizedMessage ? "ring-1 ring-primary/35" : ""
                      }`}
                      onClick={() => setSelectedClusterKey(cluster.normalizedMessage)}
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
              {selectedCluster ? (
                <ConsoleSectionCard title="선택 클러스터 상세" description="우선 처리 대상을 빠르게 확인합니다." contentClassName="pt-[var(--space-2)]">
                  <Box className="space-y-[var(--space-2)]">
                    <Flex className="items-center justify-between gap-[var(--space-2)]">
                      <Badge variant={severityVariantMap[selectedCluster.severity]} size="sm">{selectedCluster.severity}</Badge>
                      <Badge variant="secondary" size="sm">{formatNumber(selectedCluster.count)}건</Badge>
                    </Flex>
                    <Typography as="p" variant="bodySm" className="font-semibold">{selectedCluster.title}</Typography>
                    <Typography as="p" variant="caption" color="muted">{selectedCluster.normalizedMessage}</Typography>
                    <Typography as="p" variant="caption" color="subtle">
                      최초 {formatDateTime(selectedCluster.firstSeen)} · 최근 {formatDateTime(selectedCluster.lastSeen)}
                    </Typography>
                    <Button type="button" size="sm" variant="outline" onClick={createIssueFromCluster}>
                      이슈 생성
                    </Button>
                  </Box>
                </ConsoleSectionCard>
              ) : null}
            </Box>
          ) : (
            <StateView variant="info" size="sm" title="로그를 분석하면 요약 카드가 표시됩니다." />
          )
        }
      />

    </ConsolePageStack>
  );
}
