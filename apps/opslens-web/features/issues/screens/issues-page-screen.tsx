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
  bulkUpdateIssues,
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
  Input,
  Select,
  type DataTableColumnDef,
  Typography
} from "@repo/ui";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { OpsPageShell, OpsSectionCard, SeverityBadge, StatusBadge } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsFilters } from "@/features/common/stores";
import { formatDateTimeByLocale, resolveServiceLabel } from "@/features/common/utils/ops-display";
import { downloadCsv } from "@/features/common/utils/download-csv";
import { formatDateTime, formatNumber } from "@repo/utils";
import { readAuthSession } from "@/lib/auth";
import { ISSUE_FILTER_DEFAULT_VALUES, ISSUE_SEVERITY_SCORE, ISSUE_TONE } from "../constants";
import { IssuesFilterBar, IssuesSummaryCards } from "../components";
import type { IssueFilterFormValues } from "../types";
import { isIssueSlaRisk } from "../utils/issues-utils";

export default function IssuesPage() {
  const { environment, locale, serviceName, search } = useOpsFilters();
  const tService = useTranslations("service");
  const t = useTranslations("issues.page");
  const searchParams = useSearchParams();
  const authSession = readAuthSession();
  const currentAssigneeKeys = useMemo(
    () =>
      [authSession?.user.name, authSession?.user.email, authSession?.user.email.split("@")[0]]
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
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("analyzing");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const queryClient = useQueryClient();
  const bulkMutation = useMutation({
    mutationFn: () =>
      bulkUpdateIssues({
        issueIds: selectedIssueIds,
        status: bulkStatus as "new" | "analyzing" | "in_progress" | "resolved",
        assignee: bulkAssignee.trim() || undefined
      }),
    onSuccess: async () => {
      setSelectedIssueIds([]);
      setBulkAssignee("");
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.all });
    }
  });

  useEffect(() => {
    if (searchParams.get("assignee") !== "me") return;
    filterForm.setValue("assignee", "me");
    setPage(1);
  }, [filterForm, searchParams]);

  const issuesQuery = useQuery(
    useOpsQueryOptions("list", {
      queryKey: [
        ...opslensQueryKeys.issues({ environment, serviceName, search, status, severity, page }),
        pageSize
      ],
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
  const resolvedServerTotalCount = page === 1 && rawItems.length < pageSize ? rawItems.length : issueCount;
  const resetIssueScopedFilters = () => {
    filterForm.setValue("status", "all");
    filterForm.setValue("severity", "all");
    filterForm.setValue("assignee", "all");
    filterForm.setValue("sortBy", "recent");
    setSlaRiskOnly(false);
    setPage(1);
  };

  const exportIssues = () => {
    downloadCsv(
      `opslens-issues-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        t("csv.id"),
        t("csv.title"),
        t("csv.severity"),
        t("csv.status"),
        t("csv.service"),
        t("csv.environment"),
        t("csv.occurrences"),
        t("csv.assignee"),
        t("csv.lastOccurred")
      ],
      filteredItems.map((issue) => [
        issue.id,
        issue.title,
        issue.severity,
        issue.status,
        issue.serviceName,
        issue.environment,
        issue.occurrenceCount,
        issue.assignee,
        issue.lastOccurredAt
      ])
    );
  };

  const columns = useMemo<Array<DataTableColumnDef<Issue>>>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.issue")} />,
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
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.severity")} />,
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.status")} />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        accessorKey: "serviceName",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.service")} />
      },
      {
        accessorKey: "occurrenceCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.occurrences")} />,
        cell: ({ row }) => formatNumber(row.original.occurrenceCount, locale)
      },
      {
        accessorKey: "lastOccurredAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.lastOccurred")} />,
        cell: ({ row }) => formatDateTime(row.original.lastOccurredAt, locale)
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.slaRisk")} />,
        cell: ({ row }) => {
          const issue = row.original;
          if (issue.status === "resolved") {
            return (
              <Badge variant="secondary" size="sm">
                {t("resolved")}
              </Badge>
            );
          }
          const isRisk = isIssueSlaRisk(issue);
          return (
            <Badge variant={isRisk ? ISSUE_TONE.slaRisk : "outline"} size="sm">
              {isRisk ? t("caution") : t("normal")}
            </Badge>
          );
        }
      },
      {
        accessorKey: "assignee",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.assignee")} />,
        cell: ({ row }) => row.original.assignee || t("unassigned")
      }
    ],
    [t]
  );

  return (
    <OpsPageShell>
      <Box className="border-default bg-surface rounded-[var(--radius-xl)] border px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-5)]">
        <Flex className="items-center justify-between gap-[var(--space-3)]">
          <Typography as="h2" variant="headingMd" className="tracking-[-0.01em]">
            {t("title")}
          </Typography>
          <Flex className="flex-wrap items-center gap-[var(--space-2)]">
            <Typography as="p" variant="caption" color="subtle" className="mr-[var(--space-1)]">
              {t("lastUpdated", { value: lastUpdatedLabel })}
            </Typography>
            <Badge variant="secondary" size="sm">
              {t("service", { value: serviceLabel })}
            </Badge>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={exportIssues}
              disabled={filteredItems.length === 0}
            >
              {t("exportCsv")}
            </Button>
          </Flex>
        </Flex>
      </Box>

      <OpsSectionCard title={t("listTitle")} description={t("listDescription")}>
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
        {selectedIssueIds.length > 0 ? (
          <Box className="border-primary/30 bg-primary/5 my-[var(--space-3)] rounded-[var(--radius-md)] border p-[var(--space-2)]">
            <Typography as="p" variant="caption" className="mb-[var(--space-2)] font-semibold">
              {t("selected", { count: selectedIssueIds.length })}
            </Typography>
            <Grid className="min-w-0 gap-[var(--space-2)] sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
              <Select
                className="min-w-0"
                value={bulkStatus}
                onChange={(value) => setBulkStatus(String(value))}
                options={[
                  { label: t("bulk.analyzing"), value: "analyzing" },
                  { label: t("bulk.inProgress"), value: "in_progress" },
                  { label: t("bulk.resolved"), value: "resolved" }
                ]}
              />
              <Input
                value={bulkAssignee}
                onChange={(event) => setBulkAssignee(event.target.value)}
                placeholder={t("bulk.assigneePlaceholder")}
              />
              <Button
                type="button"
                size="sm"
                loading={bulkMutation.isPending}
                onClick={() => bulkMutation.mutate()}
              >
                {t("bulk.apply")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedIssueIds([])}>
                {t("bulk.clear")}
              </Button>
            </Grid>
          </Box>
        ) : null}

        <DataTable
          columns={columns}
          data={filteredItems}
          isLoading={issuesQuery.isLoading}
          isError={issuesQuery.isError}
          loadingMessage={t("table.loading")}
          emptyTitle={t("table.empty")}
          errorTitle={t("table.error")}
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
          selectable
          rowSelectionMode="multiple"
          selectedRowKeys={selectedIssueIds}
          onSelectedRowKeysChange={setSelectedIssueIds}
        />
      </OpsSectionCard>
    </OpsPageShell>
  );
}
