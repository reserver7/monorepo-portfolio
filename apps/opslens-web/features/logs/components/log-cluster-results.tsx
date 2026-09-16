import type { RefObject } from "react";
import { Box, Badge, Button, ConsoleSectionCard, Flex, Grid, Input, Select, Typography } from "@repo/ui";
import { FeedbackState } from "@/features/common/components/feedback-state";
import { formatDateTime, formatNumber } from "@repo/utils";

import { LOGS_SEVERITY_VARIANT_MAP } from "../constants";
import type {
  LogsCluster,
  LogsFormValues,
  LogsSavedViewsState,
  LogsSeverityFilter,
  LogsSortKey
} from "../types";

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
  const locale = useLocale();
  const t = useTranslations("logs");
  return (
    <ConsoleSectionCard title={t("results.title")} description={t("results.description")}>
      <Box className="mb-[var(--space-3)]">
        <Grid className="gap-[var(--space-2)] md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <Input
            ref={queryInputRef}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={t("results.searchPlaceholder")}
            size="md"
          />
          <Select
            value={severityFilter}
            onChange={(value) => onSeverityFilterChange(String(value) as LogsSeverityFilter)}
            options={[
              { label: t("severity.all"), value: "all" },
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
              { label: t("sort.count"), value: "countDesc" },
              { label: t("sort.latest"), value: "latestDesc" },
              { label: t("sort.severity"), value: "severityDesc" }
            ]}
          />
          <Flex className="items-center justify-end gap-[var(--space-1-5)]">
            <Button type="button" size="sm" variant="outline" onClick={onSaveCurrentView}>
              {t("results.saveView")}
            </Button>
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
                removeLabel={t("results.removeView", { name: view.name })}
                className={`cursor-pointer transition-[background-color,border-color,box-shadow,color] duration-150 ease-out ${
                  savedViewsState.activeId === view.id
                    ? "ring-primary/35 shadow-none ring-1"
                    : "shadow-none ring-0"
                }`}
              >
                {view.name}
              </Badge>
            ))}
            <Badge
              size="sm"
              variant="outline"
              interactive
              onClick={onClearSavedViews}
              className="cursor-pointer"
            >
              {t("results.clearViews")}
            </Badge>
          </Flex>
        ) : null}
      </Box>
      {clusterMeta ? (
        <Flex className="mb-[var(--space-2)] items-center gap-[var(--space-1-5)]">
          <Badge variant="secondary" size="sm">
            {t("results.displayed", { count: formatNumber(clusters.length, locale) })}
          </Badge>
          <Badge variant="outline" size="sm">
            {t("results.total", { count: formatNumber(clusterMeta.totalCount, locale) })}
          </Badge>
        </Flex>
      ) : null}
      {isError ? (
        <Box className="mb-[var(--space-2)]">
          <FeedbackState
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
                  loadingLabel={t("retrying")}
                >
                  {t("retry")}
                </Button>
              ) : undefined
            }
          />
        </Box>
      ) : null}
      {clusters.length === 0 ? (
        <FeedbackState variant="empty" size="sm" title="분석 결과가 없습니다." />
      ) : (
        <Box className="space-y-[var(--space-2)]">
          {clusters.map((cluster) => (
            <Box
              key={cluster.normalizedMessage}
              className={`border-default bg-surface rounded-[var(--radius-lg)] border p-[var(--space-3)] ${
                selectedCluster?.normalizedMessage === cluster.normalizedMessage
                  ? "ring-primary/35 ring-1"
                  : ""
              }`}
              onClick={() => onSelectCluster(cluster.normalizedMessage)}
            >
              <Flex className="flex-wrap items-center justify-between gap-[var(--space-2)]">
                <Typography as="p" variant="bodySm" className="font-semibold">
                  {cluster.title}
                </Typography>
                <Flex className="items-center gap-[var(--space-2)]">
                  <Badge
                    variant={LOGS_SEVERITY_VARIANT_MAP[cluster.severity]}
                    size="sm"
                    className="rounded-md font-semibold"
                  >
                    {cluster.severity}
                  </Badge>
                  <Badge size="sm" variant="secondary">
                    {t("count", { count: formatNumber(cluster.count, locale) })}
                  </Badge>
                </Flex>
              </Flex>
              <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">
                {cluster.normalizedMessage}
              </Typography>
              <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-2)]">
                {t("firstSeen")} {formatDateTime(cluster.firstSeen, locale)} · {t("lastSeen")}{" "}
                {formatDateTime(cluster.lastSeen, locale)}
              </Typography>
              <Box className="mt-[var(--space-2)] space-y-[var(--space-1)]">
                {cluster.suggestedActions.map((action) => (
                  <Flex key={action} className="items-start gap-[var(--space-1)]">
                    <Box as="span" className="text-muted text-caption">
                      •
                    </Box>
                    <Typography as="p" variant="caption" color="muted">
                      {action}
                    </Typography>
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
