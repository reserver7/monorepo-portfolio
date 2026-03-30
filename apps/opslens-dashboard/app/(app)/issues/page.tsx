"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RhfField, useAppForm } from "@repo/forms";
import {
  DataTable,
  DataTableColumnHeader,
  type DataTableColumnDef,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@repo/ui";
import { keepPreviousData, useQuery } from "@repo/react-query";
import { listIssues, type Issue, type IssueStatus, type Severity } from "@/features/ops/api";
import { OpsSectionCard, SeverityBadge, StatusBadge } from "@/features/ops";
import { useOpsFilters } from "@/features/ops/stores";
import { formatDateTime, formatNumber } from "@/lib/utils";
import {
  opslensQueryKeys,
  toOptionalSearch,
  toOptionalServiceName,
  toOptionalSeverity,
  toOptionalStatus
} from "@/features/ops/api";

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

  const columns = useMemo<Array<DataTableColumnDef<Issue>>>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="이슈" />,
        cell: ({ row }) => (
          <div className="align-top">
            <Link
              href={`/issues/${row.original.id}`}
              className="font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {row.original.title}
            </Link>
            <p className="mt-1 max-w-[420px] truncate text-xs text-muted">{row.original.summary}</p>
          </div>
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
    <div className="space-y-6">
      <OpsSectionCard title="이슈 리스트" description="상태/심각도/검색 조건으로 이슈를 빠르게 필터링하세요.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="grid gap-1">
              <Label size="sm">상태</Label>
              <RhfField
                control={filterForm.control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger size="md" className="min-w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-1">
              <Label size="sm">심각도</Label>
              <RhfField
                control={filterForm.control}
                name="severity"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger size="md" className="min-w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {severityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>
      </OpsSectionCard>

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
        totalCount={issuesQuery.data?.totalCount ?? 0}
        onPageChange={(nextPage) => setPage(nextPage)}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
