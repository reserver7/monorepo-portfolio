import type { RefObject } from "react";
import { Box, Badge, Button, ConsoleSectionCard, Flex, Grid, Input, Select, StateView, Typography } from "@repo/ui";
import { formatDateTime, formatNumber } from "@repo/utils";

import { LOGS_SEVERITY_VARIANT_MAP } from "../constants";
import type { LogsCluster, LogsFormValues, LogsSavedViewsState, LogsSeverityFilter, LogsSortKey } from "../types";

type LogClusterResultsProps = {
  clusters: LogsCluster[];
  clusterMeta: { totalCount: number; displayedCount: number } | null;
  error: unknown;
  isError: boolean;
  isPending: boolean;
  lastSubmitted: LogsFormValues | null;
  queryInputRef: RefObject<HTMLInputElement | null>;
  savedViewsState: LogsSavedViewsState;
  searchQuery: string;
  selectedCluster: LogsCluster | null;
  severityFilter: LogsSeverityFilter;
  sortKey: LogsSortKey;
  onApplySavedView: (id: string) => void;
  onClearSavedViews: () => void;
  onRemoveSavedView: (id: string) => void;
  onRetry: (values: LogsFormValues) => void;
  onSaveCurrentView: () => void;
  onSearchQueryChange: (value: string) => void;
  onSelectCluster: (clusterKey: string) => void;
  onSeverityFilterChange: (value: LogsSeverityFilter) => void;
  onSortKeyChange: (value: LogsSortKey) => void;
  resolveErrorMessage: (error: unknown) => string;
};

export function LogClusterResults({
  clusters,
  clusterMeta,
  error,
  isError,
  isPending,
  lastSubmitted,
  queryInputRef,
  savedViewsState,
  searchQuery,
  selectedCluster,
  severityFilter,
  sortKey,
  onApplySavedView,
  onClearSavedViews,
  onRemoveSavedView,
  onRetry,
  onSaveCurrentView,
  onSearchQueryChange,
  onSelectCluster,
  onSeverityFilterChange,
  onSortKeyChange,
  resolveErrorMessage
}: LogClusterResultsProps) {
  return (
    <ConsoleSectionCard title="분석 결과 클러스터" description="중복 패턴과 심각도를 기준으로 정리된 결과입니다.">
      <Box className="mb-[var(--space-3)]">
        <Grid className="gap-[var(--space-2)] md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <Input
            ref={queryInputRef}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="클러스터 검색 (/)"
            size="md"
          />
          <Select
            value={severityFilter}
            onChange={(value) => onSeverityFilterChange(String(value) as LogsSeverityFilter)}
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
            onChange={(value) => onSortKeyChange(String(value) as LogsSortKey)}
            options={[
              { label: "정렬: 발생량", value: "countDesc" },
              { label: "정렬: 최근순", value: "latestDesc" },
              { label: "정렬: 심각도", value: "severityDesc" }
            ]}
          />
          <Flex className="items-center justify-end gap-[var(--space-1-5)]">
            <Button type="button" size="sm" variant="outline" onClick={onSaveCurrentView}>뷰 저장</Button>
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
                onClick={() => onApplySavedView(view.id)}
                onRemove={() => onRemoveSavedView(view.id)}
                removeLabel={`${view.name} 삭제`}
                className={`cursor-pointer transition-[background-color,border-color,box-shadow,color] duration-150 ease-out ${
                  savedViewsState.activeId === view.id ? "ring-1 ring-primary/35 shadow-none" : "ring-0 shadow-none"
                }`}
              >
                {view.name}
              </Badge>
            ))}
            <Badge size="sm" variant="outline" interactive onClick={onClearSavedViews} className="cursor-pointer">
              내 뷰 삭제
            </Badge>
          </Flex>
        ) : null}
      </Box>
      {clusterMeta ? (
        <Flex className="mb-[var(--space-2)] items-center gap-[var(--space-1-5)]">
          <Badge variant="secondary" size="sm">표시 {formatNumber(clusters.length)}건</Badge>
          <Badge variant="outline" size="sm">전체 {formatNumber(clusterMeta.totalCount)}건</Badge>
        </Flex>
      ) : null}
      {isError ? (
        <Box className="mb-[var(--space-2)]">
          <StateView
            variant="error"
            size="sm"
            title={resolveErrorMessage(error)}
            action={
              lastSubmitted ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onRetry(lastSubmitted)}
                  loading={isPending ? true : undefined}
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
              className={`border-default bg-surface rounded-[var(--radius-lg)] border p-[var(--space-3)] ${
                selectedCluster?.normalizedMessage === cluster.normalizedMessage ? "ring-1 ring-primary/35" : ""
              }`}
              onClick={() => onSelectCluster(cluster.normalizedMessage)}
            >
              <Flex className="flex-wrap items-center justify-between gap-[var(--space-2)]">
                <Typography as="p" variant="bodySm" className="font-semibold">{cluster.title}</Typography>
                <Flex className="items-center gap-[var(--space-2)]">
                  <Badge variant={LOGS_SEVERITY_VARIANT_MAP[cluster.severity]} size="sm" className="rounded-md font-semibold">
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
  );
}
