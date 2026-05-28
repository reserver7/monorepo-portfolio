"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { useAppForm } from "@repo/forms";
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
import { listIssues, type Issue, type IssueStatus, type Severity } from "@repo/opslens";
import { OpsPageShell, OpsSectionCard, SeverityBadge, StatusBadge } from "@/features";
import { formatDateTimeByLocale, resolveServiceLabel } from "@/features/utils/ops-display";
import { useOpsFilters } from "@/features/stores";
import { useOpsQueryOptions } from "@/features/query/use-ops-query-options";
import { formatDateTime, formatNumber } from "@repo/utils";
import {
  opslensQueryKeys,
  toOptionalSearch,
  toOptionalServiceName,
  toOptionalSeverity,
  toOptionalStatus
} from "@repo/opslens";

const statusOptions: Array<{ label: string; value: "all" | IssueStatus }> = [
  { label: "전체", value: "all" },
  { label: "신규", value: "new" },
  { label: "분석중", value: "analyzing" },
  { label: "대응중", value: "in_progress" },
  { label: "해결", value: "resolved" }
];

const severityOptions: Array<{ label: string; value: "all" | Severity }> = [
  { label: "전체", value: "all" },
  { label: "critical", value: "critical" },
  { label: "high", value: "high" },
  { label: "medium", value: "medium" },
  { label: "low", value: "low" }
];

const assigneeOptions: Array<{ label: string; value: "all" | "assigned" | "unassigned" }> = [
  { label: "전체", value: "all" },
  { label: "지정됨", value: "assigned" },
  { label: "미지정", value: "unassigned" }
];

const sortOptions: Array<{ label: string; value: "recent" | "occurrence" | "severity" }> = [
  { label: "최근 발생순", value: "recent" },
  { label: "발생 횟수순", value: "occurrence" },
  { label: "심각도순", value: "severity" }
];

const severityScore: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

const issueTone = {
  criticalHigh: "danger",
  unassigned: "info",
  slaRisk: "warning"
} as const;

function isSlaRisk(issue: Issue) {
  if (issue.status === "resolved") return false;
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(issue.lastOccurredAt).getTime()) / 60000)
  );
  if (issue.severity === "critical") return elapsedMinutes >= 30;
  if (issue.severity === "high") return elapsedMinutes >= 60;
  return false;
}

export default function IssuesPage() {
  const { environment, locale, serviceName, search } = useOpsFilters();
  const tService = useTranslations("service");

  const filterForm = useAppForm<{
    status: "all" | IssueStatus;
    severity: "all" | Severity;
    assignee: "all" | "assigned" | "unassigned";
    sortBy: "recent" | "occurrence" | "severity";
  }>({
    defaultValues: {
      status: "all",
      severity: "all",
      assignee: "all",
      sortBy: "recent"
    }
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
    const byRisk = slaRiskOnly ? byAssignee.filter((item) => isSlaRisk(item)) : byAssignee;
    const sorted = [...byRisk].sort((a, b) => {
      if (sortBy === "occurrence") return b.occurrenceCount - a.occurrenceCount;
      if (sortBy === "severity") return severityScore[b.severity] - severityScore[a.severity];
      return new Date(b.lastOccurredAt).getTime() - new Date(a.lastOccurredAt).getTime();
    });
    return sorted;
  }, [assignee, rawItems, slaRiskOnly, sortBy]);

  const summary = useMemo(() => {
    const openItems = kpiItems.filter((item) => item.status !== "resolved");
    const criticalHigh = openItems.filter((item) => item.severity === "critical" || item.severity === "high");
    const unassigned = openItems.filter((item) => !item.assignee);
    const slaRisk = openItems.filter((item) => isSlaRisk(item));
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
            title={row.original.title}
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
          const isRisk = isSlaRisk(issue);
          return (
            <Badge variant={isRisk ? issueTone.slaRisk : "outline"} size="sm">
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
            color={issueTone.criticalHigh}
            size="md"
            className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:text-[11px]"
          />
          <StatCard
            label="Unassigned"
            value={formatNumber(summary.unassigned)}
            helper="담당자 미지정"
            color={issueTone.unassigned}
            size="md"
            className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:text-[11px]"
          />
          <StatCard
            label="SLA Risk"
            value={formatNumber(summary.slaRisk)}
            helper="지연 임계치 초과"
            color={issueTone.slaRisk}
            size="md"
            className="h-full rounded-[var(--radius-lg)] [&>p:nth-of-type(2)]:text-[1.625rem] [&>p:nth-of-type(2)]:leading-[1.1] [&>p:last-child]:text-[11px]"
          />
        </Grid>

        <Box className="border-default bg-surface mb-[var(--space-3)] rounded-[var(--radius-md)] border p-[var(--space-3)]">
          <Grid className="gap-[var(--space-2)] md:grid-cols-2 xl:grid-cols-5">
            <Select
              options={statusOptions}
              control={filterForm.control}
              name="status"
              onChange={() => setPage(1)}
              size="sm"
            />
            <Select
              options={severityOptions}
              control={filterForm.control}
              name="severity"
              onChange={() => setPage(1)}
              size="sm"
            />
            <Select
              options={assigneeOptions}
              control={filterForm.control}
              name="assignee"
              onChange={() => setPage(1)}
              size="sm"
            />
            <Select
              options={sortOptions}
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
