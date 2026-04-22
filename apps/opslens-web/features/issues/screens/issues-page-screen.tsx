"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppForm } from "@repo/forms";
import {
  Box,
  DataTable,
  DataTableColumnHeader,
  Grid,
  type DataTableColumnDef,
  Label,
  Select,
  SplitWorkspaceLayout,
  Typography
} from "@repo/ui";
import { keepPreviousData, useQuery } from "@repo/react-query";
import { listIssues, type Issue, type IssueStatus, type Severity } from "@repo/opslens";
import { OpsPageShell, OpsSectionCard, SeverityBadge, StatusBadge } from "@/features";
import { useOpsFilters } from "@/features/stores";
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

export default function IssuesPage() {
  const { environment, serviceName, search } = useOpsFilters();

  const filterForm = useAppForm<{ status: "all" | IssueStatus; severity: "all" | Severity }>({
    defaultValues: {
      status: "all",
      severity: "all"
    }
  });
  const status = filterForm.watch("status");
  const severity = filterForm.watch("severity");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const issuesQuery = useQuery({
    queryKey: opslensQueryKeys.issues({ environment, serviceName, search, status, severity, page }),
    placeholderData: keepPreviousData,
    staleTime: 10 * 1000,
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
  });

  const totalPages = useMemo(() => {
    const total = issuesQuery.data?.totalCount ?? 0;
    return Math.max(Math.ceil(total / pageSize), 1);
  }, [issuesQuery.data?.totalCount]);
  const issueCount = issuesQuery.data?.totalCount ?? 0;

  const columns = useMemo<Array<DataTableColumnDef<Issue>>>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="이슈" />,
        cell: ({ row }) => (
          <Box className="align-top">
            <Link
              href={`/issues/${row.original.id}`}
              className="text-foreground hover:text-primary focus-visible:ring-primary focus-visible:ring-offset-surface font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {row.original.title}
            </Link>
            <Box as="p" className="text-muted mt-[var(--space-1)] max-w-[420px] truncate text-caption">{row.original.summary}</Box>
          </Box>
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
        accessorKey: "assignee",
        header: ({ column }) => <DataTableColumnHeader column={column} title="담당자" />,
        cell: ({ row }) => row.original.assignee || "미지정"
      }
    ],
    []
  );

  return (
    <OpsPageShell>
      <SplitWorkspaceLayout
        sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_320px]"
        main={
          <OpsSectionCard title="이슈 리스트" description="운영 우선순위 기준으로 이슈를 빠르게 탐색합니다.">
            <DataTable
              columns={columns}
              data={issuesQuery.data?.items ?? []}
              isLoading={issuesQuery.isLoading}
              isError={issuesQuery.isError}
              loadingMessage="이슈 데이터를 불러오는 중..."
              emptyTitle="조건에 맞는 이슈가 없습니다."
              errorTitle="이슈 조회에 실패했습니다."
              tableClassName="min-w-[900px]"
              page={page}
              totalPages={totalPages}
              totalCount={issueCount}
              onPageChange={(nextPage) => setPage(nextPage)}
              getRowId={(row) => row.id}
            />
          </OpsSectionCard>
        }
        sidebar={
          <OpsSectionCard title="필터" description="조건 변경 시 목록이 자동 갱신됩니다.">
            <Box className="space-y-[var(--space-4)]">
              <Grid className="gap-[var(--space-1)]">
                <Label size="sm">상태</Label>
                <Select
                  options={statusOptions}
                  control={filterForm.control}
                  name="status"
                  onChange={() => setPage(1)}
                  size="md"
                />
              </Grid>
              <Grid className="gap-[var(--space-1)]">
                <Label size="sm">심각도</Label>
                <Select
                  options={severityOptions}
                  control={filterForm.control}
                  name="severity"
                  onChange={() => setPage(1)}
                  size="md"
                />
              </Grid>
              <Box className="border-default bg-surface-elevated rounded-xl border p-[var(--space-3)]">
                <Typography as="p" variant="caption" color="subtle" className="font-semibold">
                  현재 결과
                </Typography>
                <Typography as="p" variant="h3" className="mt-[var(--space-1)]">
                  {formatNumber(issueCount)}
                </Typography>
                <Typography as="p" variant="caption" color="muted">
                  page {page} / {totalPages}
                </Typography>
              </Box>
            </Box>
          </OpsSectionCard>
        }
      />
    </OpsPageShell>
  );
}
