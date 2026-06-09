"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { useAppForm } from "@repo/forms";
import {
  listIssues,
  opslensQueryKeys,
  toOptionalSearch,
  toOptionalServiceName,
  toOptionalSeverity,
  toOptionalStatus,
  type Issue
} from "@repo/opslens";
import {
  Badge,
  Box,
  Button,
  DataTable,
  DataTableColumnHeader,
  Flex,
  Grid,
  StatCard,
  type DataTableColumnDef,
  Select,
  Typography
} from "@repo/ui";
import { keepPreviousData, useQuery } from "@repo/react-query";
import { OpsPageShell, OpsSectionCard, SeverityBadge, StatusBadge } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsFilters } from "@/features/common/stores";
import { formatDateTimeByLocale, resolveServiceLabel } from "@/features/common/utils/ops-display";
import { formatDateTime, formatNumber } from "@repo/utils";
import {
  ISSUE_ASSIGNEE_OPTIONS,
  ISSUE_FILTER_DEFAULT_VALUES,
  ISSUE_SEVERITY_OPTIONS,
  ISSUE_SEVERITY_SCORE,
  ISSUE_SORT_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  ISSUE_TONE
} from "../constants";
import type { IssueFilterFormValues } from "../types";
import { isIssueSlaRisk } from "../utils/issues-utils";

export default function IssuesPage() {
  const { environment, locale, serviceName, search } = useOpsFilters();
  const tService = useTranslations("service");

  const filterForm = useAppForm<IssueFilterFormValues>({
    defaultValues: ISSUE_FILTER_DEFAULT_VALUES
  });
  const status = filterForm.watch("status");
  const severity = filterForm.watch("severity");
  const assignee = filterForm.watch("assignee");
  const sortBy = filterForm.watch("sortBy");
  const [page, setPage] = useState(1);
  const [slaRiskOnly, setSlaRiskOnly] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const kpiPageSize = 200;

  const issuesQuery = useQuery(
    useOpsQueryOptions("list", {
      queryKey: [...opslensQueryKeys.issues({ environment, serviceName, search, status, severity, page }), pageSize],
      placeholderData: keepPreviousData,
      queryFn: () =>
        listIssues({
          environment,
          serviceName: toOptionalServiceName(serviceName),
          query: toOptionalSearch(search),
          status: toOptionalStatus(status),
          severity: toOptionalSeverity(severity),
          page,
          pageSize
        })
    })
  );
  const kpiQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: [
        "issues-kpi",
        environment,
        serviceName,
        search,
        status,
        severity
      ],
      queryFn: async () => {
        let currentPage = 1;
        let totalCount = 0;
        const allItems: Issue[] = [];
        while (currentPage <= 20) {
          const response = await listIssues({
            environment,
            serviceName: toOptionalServiceName(serviceName),
            query: toOptionalSearch(search),
            status: toOptionalStatus(status),
            severity: toOptionalSeverity(severity),
            page: currentPage,
            pageSize: kpiPageSize
          });
          if (currentPage === 1) totalCount = response.totalCount;
          allItems.push(...response.items);
          if (allItems.length >= totalCount || response.items.length === 0) break;
          currentPage += 1;
        }
        return allItems;
      }
    })
  );

  const totalPages = useMemo(() => {
    const total = issuesQuery.data?.totalCount ?? 0;
    return Math.max(Math.ceil(total / pageSize), 1);
  }, [issuesQuery.data?.totalCount]);
  const issueCount = issuesQuery.data?.totalCount ?? 0;
  const serviceLabel = resolveServiceLabel(serviceName, tService);
  const lastUpdatedLabel = issuesQuery.dataUpdatedAt
    ? formatDateTimeByLocale(new Date(issuesQuery.dataUpdatedAt).toISOString(), locale)
    : "-";
  const rawItems = issuesQuery.data?.items ?? [];
  const kpiItems = kpiQuery.data ?? [];
  const filteredItems = useMemo(() => {
    const byAssignee = rawItems.filter((item) => {
      if (assignee === "assigned") return Boolean(item.assignee);
      if (assignee === "unassigned") return !item.assignee;
      return true;
    });
    const byRisk = slaRiskOnly ? byAssignee.filter((item) => isIssueSlaRisk(item)) : byAssignee;
    const sorted = [...byRisk].sort((a, b) => {
      if (sortBy === "occurrence") return b.occurrenceCount - a.occurrenceCount;
      if (sortBy === "severity") return ISSUE_SEVERITY_SCORE[b.severity] - ISSUE_SEVERITY_SCORE[a.severity];
      return new Date(b.lastOccurredAt).getTime() - new Date(a.lastOccurredAt).getTime();
    });
    return sorted;
  }, [assignee, rawItems, slaRiskOnly, sortBy]);

  const summary = useMemo(() => {
    const openItems = kpiItems.filter((item) => item.status !== "resolved");
    const criticalHigh = openItems.filter((item) => item.severity === "critical" || item.severity === "high");
    const unassigned = openItems.filter((item) => !item.assignee);
    const slaRisk = openItems.filter((item) => isIssueSlaRisk(item));
    return {
      open: openItems.length,
      criticalHigh: criticalHigh.length,
      unassigned: unassigned.length,
      slaRisk: slaRisk.length
    };
  }, [kpiItems]);
  const hasIssueScopedFilter =
    status !== "all" || severity !== "all" || assignee !== "all" || sortBy !== "recent" || slaRiskOnly;
  const hasClientScopedFilter = assignee !== "all" || sortBy !== "recent" || slaRiskOnly;
  const resolvedServerTotalPages = page === 1 && rawItems.length < pageSize ? 1 : totalPages;
  const resolvedServerTotalCount =
    page === 1 && rawItems.length < pageSize ? rawItems.length : issueCount;
  const resetIssueScopedFilters = () => {
    filterForm.setValue("status", "all");
    filterForm.setValue("severity", "all");
    filterForm.setValue("assignee", "all");
    filterForm.setValue("sortBy", "recent");
    setSlaRiskOnly(false);
    setPage(1);
  };

  const columns = useMemo<Array<DataTableColumnDef<Issue>>>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="이슈" />,
        width: "40%",
        minWidth: 420,
        cell: ({ row }) => (
          <Link
            href={`/issues/${row.original.id}`}
            className="text-foreground hover:text-primary focus-visible:ring-primary focus-visible:ring-offset-surface block truncate font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            {row.original.title}
          </Link>
        )
      },
      {
        accessorKey: "severity",
        header: ({ column }) => <DataTableColumnHeader column={column} title="심각도" />,
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="상태" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        accessorKey: "serviceName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="서비스" />
      },
      {
        accessorKey: "occurrenceCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="발생 횟수" />,
        cell: ({ row }) => formatNumber(row.original.occurrenceCount)
      },
      {
        accessorKey: "lastOccurredAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="최근 발생" />,
        cell: ({ row }) => formatDateTime(row.original.lastOccurredAt)
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="SLA 리스크" />,
        cell: ({ row }) => {
          const issue = row.original;
          if (issue.status === "resolved") {
            return (
              <Badge variant="secondary" size="sm">
                해결됨
              </Badge>
            );
          }
          const isRisk = isIssueSlaRisk(issue);
          return (
            <Badge variant={isRisk ? ISSUE_TONE.slaRisk : "outline"} size="sm">
              {isRisk ? "주의" : "정상"}
            </Badge>
          );
        }
      },
      {
        accessorKey: "assignee",
        header: ({ column }) => <DataTableColumnHeader column={column} title="담당자" />,
        cell: ({ row }) => row.original.assignee || "미지정"
      }
    ],
    []
  );

  return (
    <OpsPageShell>
      <Box className="border-default bg-surface rounded-[var(--radius-xl)] border px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-5)]">
        <Flex className="items-center justify-between gap-[var(--space-3)]">
          <Typography as="h2" variant="headingMd" className="tracking-[-0.01em]">
            이슈 운영
          </Typography>
          <Flex className="flex-wrap items-center gap-[var(--space-2)]">
            <Typography as="p" variant="caption" color="subtle" className="mr-[var(--space-1)]">
              최근 갱신: {lastUpdatedLabel}
            </Typography>
            <Badge variant="secondary" size="sm">서비스: {serviceLabel}</Badge>
          </Flex>
        </Flex>
      </Box>

      <OpsSectionCard
        title="이슈 리스트"
        description="전역 필터(환경/서비스/검색/기간) + 이슈 전용 조건으로 우선순위를 빠르게 정리합니다."
      >
        <Grid className="mb-[var(--space-3)] grid-cols-2 gap-[var(--space-2)] md:grid-cols-4">
          <StatCard
            label="Open Issues"
            value={formatNumber(summary.open)}
            helper="현재 미해결 이슈"
            size="md"
            className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:text-[11px]"
          />
          <StatCard
            label="Critical / High"
            value={formatNumber(summary.criticalHigh)}
            helper="우선 대응 대상"
            color={ISSUE_TONE.criticalHigh}
            size="md"
            className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:text-[11px]"
          />
          <StatCard
            label="Unassigned"
            value={formatNumber(summary.unassigned)}
            helper="담당자 미지정"
            color={ISSUE_TONE.unassigned}
            size="md"
            className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:text-[11px]"
          />
          <StatCard
            label="SLA Risk"
            value={formatNumber(summary.slaRisk)}
            helper="지연 임계치 초과"
            color={ISSUE_TONE.slaRisk}
            size="md"
            className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:text-[11px]"
          />
        </Grid>

        <Box className="border-default bg-surface mb-[var(--space-3)] rounded-[var(--radius-md)] border p-[var(--space-3)]">
          <Grid className="gap-[var(--space-2)] md:grid-cols-2 xl:grid-cols-5">
            <Select
              options={ISSUE_STATUS_OPTIONS}
              control={filterForm.control}
              name="status"
              onChange={() => setPage(1)}
              size="sm"
            />
            <Select
              options={ISSUE_SEVERITY_OPTIONS}
              control={filterForm.control}
              name="severity"
              onChange={() => setPage(1)}
              size="sm"
            />
            <Select
              options={ISSUE_ASSIGNEE_OPTIONS}
              control={filterForm.control}
              name="assignee"
              onChange={() => setPage(1)}
              size="sm"
            />
            <Select
              options={ISSUE_SORT_OPTIONS}
              control={filterForm.control}
              name="sortBy"
              onChange={() => setPage(1)}
              size="sm"
            />
            <Flex className="items-center gap-[var(--space-1)]">
              <Button
                variant={slaRiskOnly ? "primary" : "secondary"}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSlaRiskOnly((prev) => !prev);
                  setPage(1);
                }}
              >
                SLA
              </Button>
              <Button
                variant="secondary"
                size="sm"
                iconOnly
                leftIcon={<RotateCcw />}
                aria-label="이슈 전용 필터 초기화"
                disabled={!hasIssueScopedFilter}
                onClick={resetIssueScopedFilters}
              />
            </Flex>
          </Grid>
        </Box>

        <DataTable
          columns={columns}
          data={filteredItems}
          isLoading={issuesQuery.isLoading}
          isError={issuesQuery.isError}
          loadingMessage="이슈 데이터를 불러오는 중..."
          emptyTitle="조건에 맞는 이슈가 없습니다."
          errorTitle="이슈 조회에 실패했습니다."
          tableClassName="min-w-full"
          manualPagination
          pageSize={pageSize}
          hidePaginationOnSinglePage={false}
          enablePagination
          page={hasClientScopedFilter ? 1 : page}
          totalPages={hasClientScopedFilter ? 1 : resolvedServerTotalPages}
          totalCount={hasClientScopedFilter ? filteredItems.length : resolvedServerTotalCount}
          onPageChange={(nextPage) => setPage(hasClientScopedFilter ? 1 : nextPage)}
          pageSizeOptions={[10, 20, 50]}
          showPageSizeSelector
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
          getRowId={(row) => row.id}
        />
      </OpsSectionCard>
    </OpsPageShell>
  );
}
