import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Badge, Button, DataTable, DataTableColumnHeader } from "../../../../index";

type IssueRow = {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved";
  service: string;
  occurrences: number;
  updatedAt: string;
};

type DataTableStoryArgs = {
  isLoading: boolean;
  isError: boolean;
  enablePagination: boolean;
  paginationAlign: "left" | "center" | "right";
  columnDivider: boolean;
  headerTextAlign: "left" | "center" | "right";
  cellTextAlign: "left" | "center" | "right";
  selectable: boolean;
  rowSelectionMode: "single" | "multiple";
  sortable: boolean;
  columnResizeEnabled: boolean;
  virtualized: boolean;
  virtualizationMode: "paged" | "infinite";
  virtualRowHeight: number;
  virtualOverscan: number;
  tableDensity: "compact" | "default" | "comfortable";
  stickyHeader: boolean;
  striped: boolean;
  emptyTitle: string;
  errorTitle: string;
  defaultPageSize: number;
};

const rows: IssueRow[] = [
  {
    id: "ISSUE-1024",
    title: "문서 권한 강등 후 재요청 루프",
    severity: "high",
    status: "investigating",
    service: "docs-api",
    occurrences: 37,
    updatedAt: "2분 전"
  },
  {
    id: "ISSUE-1021",
    title: "화이트보드 연결 끊김 재연결 지연",
    severity: "medium",
    status: "open",
    service: "socket-gateway",
    occurrences: 14,
    updatedAt: "11분 전"
  },
  {
    id: "ISSUE-998",
    title: "보호 키 검증 실패 토스트 문구 누락",
    severity: "low",
    status: "resolved",
    service: "ui-shell",
    occurrences: 5,
    updatedAt: "34분 전"
  }
];

const severityToBadge: Record<IssueRow["severity"], "danger" | "warning" | "info" | "secondary"> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "info"
};

const statusToBadge: Record<IssueRow["status"], "danger" | "warning" | "success"> = {
  open: "danger",
  investigating: "warning",
  resolved: "success"
};

const columns = [
  {
    id: "title",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="이슈" />,
    cell: ({ row }: { row: { original: IssueRow } }) => (
      <div className="space-y-0.5">
        <p className="font-medium">{row.original.title}</p>
        <p className="text-muted text-xs">{row.original.id}</p>
      </div>
    )
  },
  {
    id: "severity",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="심각도" />,
    cell: ({ row }: { row: { original: IssueRow } }) => (
      <Badge variant={severityToBadge[row.original.severity]}>{row.original.severity}</Badge>
    )
  },
  {
    id: "status",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="상태" />,
    cell: ({ row }: { row: { original: IssueRow } }) => <Badge variant={statusToBadge[row.original.status]}>{row.original.status}</Badge>
  },
  {
    id: "service",
    accessorKey: "service",
    fixed: "left",
    width: 180,
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="서비스" />
  },
  {
    id: "occurrences",
    accessorKey: "occurrences",
    align: "right",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="발생 횟수" />,
    cellClassName: ({ value }: { value: unknown }) => (Number(value) >= 30 ? "text-danger font-semibold" : undefined)
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="최근 발생" />
  },
  {
    id: "action",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="액션" />,
    fixed: "right",
    align: "center",
    width: 120,
    render: ({ row }: { row: { isLast: boolean } }) =>
      row.isLast ? (
        <Button size="sm" variant="outline" onClick={() => window.alert("마지막 행 액션")}>
          선택
        </Button>
      ) : (
        "-"
      )
  }
];

const meta: Meta<DataTableStoryArgs> = {
  title: "Components/DataTable",
  component: DataTable,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { expanded: true, exclude: ["className", "id", "name", /^on[A-Z].*/] }
  },
  args: {
    isLoading: false,
    isError: false,
    enablePagination: true,
    paginationAlign: "center",
    columnDivider: false,
    headerTextAlign: "center",
    cellTextAlign: "center",
    selectable: false,
    rowSelectionMode: "multiple",
    sortable: false,
    columnResizeEnabled: true,
    virtualized: false,
    virtualizationMode: "paged",
    virtualRowHeight: 44,
    virtualOverscan: 6,
    tableDensity: "default",
    stickyHeader: true,
    striped: true,
    emptyTitle: "표시할 이슈가 없습니다.",
    errorTitle: "이슈 목록을 불러오지 못했습니다.",
    defaultPageSize: 10
  },
  argTypes: {
    isLoading: { control: "boolean" },
    isError: { control: "boolean" },
    enablePagination: { control: "boolean" },
    paginationAlign: { control: "inline-radio", options: ["left", "center", "right"] },
    columnDivider: { control: "boolean" },
    headerTextAlign: { control: "inline-radio", options: ["left", "center", "right"] },
    cellTextAlign: { control: "inline-radio", options: ["left", "center", "right"] },
    selectable: { control: "boolean" },
    rowSelectionMode: { control: "inline-radio", options: ["single", "multiple"] },
    sortable: { control: "boolean" },
    columnResizeEnabled: { control: "boolean" },
    virtualized: { control: "boolean" },
    virtualizationMode: { control: "inline-radio", options: ["paged", "infinite"] },
    virtualRowHeight: { control: { type: "number", min: 24, step: 1 } },
    virtualOverscan: { control: { type: "number", min: 0, step: 1 } },
    tableDensity: { control: "inline-radio", options: ["compact", "default", "comfortable"] },
    stickyHeader: { control: "boolean" },
    striped: { control: "boolean" },
    emptyTitle: { control: "text" },
    errorTitle: { control: "text" },
    defaultPageSize: { control: { type: "number", min: 1, step: 1 } }
  }
};

export default meta;
type Story = StoryObj<DataTableStoryArgs>;

export const Playground: Story = {
  render: (args) => {
    const [filters, setFilters] = React.useState<Record<string, string>>({});

    return (
      <DataTable<IssueRow>
        columns={columns}
        data={rows}
        isLoading={args.isLoading}
        isError={args.isError}
        enablePagination={args.enablePagination}
        paginationAlign={args.paginationAlign}
        columnDivider={args.columnDivider}
        headerTextAlign={args.headerTextAlign}
        cellTextAlign={args.cellTextAlign}
        selectable={args.selectable}
        rowSelectionMode={args.rowSelectionMode}
        sortable={args.sortable}
        columnResizeEnabled={args.columnResizeEnabled}
        virtualized={args.virtualized}
        virtualizationMode={args.virtualizationMode}
        virtualRowHeight={args.virtualRowHeight}
        virtualOverscan={args.virtualOverscan}
        emptyTitle={args.emptyTitle}
        errorTitle={args.errorTitle}
        tableDensity={args.tableDensity}
        stickyHeader={args.stickyHeader}
        striped={args.striped}
        defaultPageSize={args.defaultPageSize}
        filters={filters}
        onFiltersChange={(nextFilters) => setFilters(nextFilters as Record<string, string>)}
        filterFn={(row, activeFilters) => {
          const keyword = String(activeFilters.keyword ?? "").trim().toLowerCase();
          if (!keyword) return true;
          return (
            row.title.toLowerCase().includes(keyword) ||
            row.id.toLowerCase().includes(keyword) ||
            row.service.toLowerCase().includes(keyword) ||
            row.status.toLowerCase().includes(keyword) ||
            row.severity.toLowerCase().includes(keyword)
          );
        }}
        toolbar={({ query, setFilters, resetFilters }) => (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={String(query.filters.keyword ?? "")}
              onChange={(event) => setFilters({ ...query.filters, keyword: event.currentTarget.value })}
              placeholder="키워드 검색"
              className="border-default h-9 w-[220px] rounded-md border bg-surface px-3 text-sm"
            />
            <Button size="sm" variant="outline" onClick={resetFilters}>
              초기화
            </Button>
          </div>
        )}
        getRowId={(row) => row.id}
      />
    );
  }
};
