"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppForm } from "@repo/forms";
import {
  getIssueSummary,
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
  DataTable,
  DataTableColumnHeader,
  Flex,
  type DataTableColumnDef,
  Typography
} from "@repo/ui";
import { keepPreviousData, useQuery } from "@repo/react-query";
import { OpsPageShell, OpsSectionCard, SeverityBadge, StatusBadge } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsFilters } from "@/features/common/stores";
import { formatDateTimeByLocale, resolveServiceLabel } from "@/features/common/utils/ops-display";
import { formatDateTime, formatNumber } from "@repo/utils";
import { readAuthSession } from "@/lib/auth";
import {
  ISSUE_FILTER_DEFAULT_VALUES,
  ISSUE_SEVERITY_SCORE,
  ISSUE_TONE
} from "../constants";
import { IssuesFilterBar, IssuesSummaryCards } from "../components";
import type { IssueFilterFormValues } from "../types";
import { isIssueSlaRisk } from "../utils/issues-utils";

export default function IssuesPage() {
  const { environment, locale, serviceName, search } = useOpsFilters();
  const tService = useTranslations("service");
  const searchParams = useSearchParams();
  const authSession = readAuthSession();
  const currentAssigneeKeys = useMemo(
    () =>
      [
        authSession?.user.name,
        authSession?.user.email,
        authSession?.user.email.split("@")[0]
      ]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase()),
    [authSession?.user.email, authSession?.user.name]
  );

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

  useEffect(() => {
    if (searchParams.get("assignee") !== "me") return;
    filterForm.setValue("assignee", "me");
    setPage(1);
  }, [filterForm, searchParams]);

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
  const summaryQuery = useQuery(
    useOpsQueryOptions("default", {
      queryKey: opslensQueryKeys.issueSummary({ environment, serviceName, search, status, severity }),
      queryFn: () =>
        getIssueSummary({
          environment,
          serviceName: toOptionalServiceName(serviceName),
          query: toOptionalSearch(search),
          status: toOptionalStatus(status),
          severity: toOptionalSeverity(severity)
        })
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
  const filteredItems = useMemo(() => {
    const byAssignee = rawItems.filter((item) => {
      if (assignee === "me") {
        const itemAssignee = item.assignee?.toLowerCase();
        return Boolean(itemAssignee && currentAssigneeKeys.some((key) => itemAssignee.includes(key)));
      }
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
  }, [assignee, currentAssigneeKeys, rawItems, slaRiskOnly, sortBy]);

  const summary = summaryQuery.data ?? { open: 0, criticalHigh: 0, unassigned: 0, slaRisk: 0 };
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
        <IssuesSummaryCards summary={summary} />

        <IssuesFilterBar
          form={filterForm}
          hasFilter={hasIssueScopedFilter}
          slaRiskOnly={slaRiskOnly}
          onFilterChange={() => setPage(1)}
          onReset={resetIssueScopedFilters}
          onToggleSlaRisk={() => {
            setSlaRiskOnly((prev) => !prev);
            setPage(1);
          }}
        />

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
