"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { useQuery } from "@repo/react-query";
import { listIssues, type Issue, type IssueStatus, type Severity } from "@/lib/api";
import { OpsSectionCard, SeverityBadge, StatusBadge } from "@/components/opslens";
import { useOpsFilterStore } from "@/lib/store";
import { formatDateTime, formatNumber } from "@/lib/utils";

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
  const environment = useOpsFilterStore((state) => state.environment);
  const serviceName = useOpsFilterStore((state) => state.serviceName);
  const search = useOpsFilterStore((state) => state.search);

  const [status, setStatus] = useState<"all" | IssueStatus>("all");
  const [severity, setSeverity] = useState<"all" | Severity>("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const issuesQuery = useQuery({
    queryKey: ["opslens", "issues", environment, serviceName, search, status, severity, page],
    queryFn: () =>
      listIssues({
        environment,
        serviceName,
        query: search || undefined,
        status: status === "all" ? undefined : status,
        severity: severity === "all" ? undefined : severity,
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
            <Link href={`/issues/${row.original.id}`} className="font-semibold text-foreground hover:text-primary">
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
    <div className="space-y-5">
      <OpsSectionCard title="이슈 리스트" description="상태/심각도/검색 조건으로 이슈를 빠르게 필터링하세요.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="grid gap-1">
              <Label className="text-xs">상태</Label>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as "all" | IssueStatus);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 min-w-[140px]">
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
            </div>

            <div className="grid gap-1">
              <Label className="text-xs">심각도</Label>
              <Select
                value={severity}
                onValueChange={(value) => {
                  setSeverity(value as "all" | Severity);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 min-w-[140px]">
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
