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

const virtualizationRows: IssueRow[] = Array.from({ length: 60 }, (_, index) => ({
  id: "ISSUE-" + (1100 + index),
  title: "가상화 테스트 이슈 " + (index + 1),
  severity: index % 4 === 0 ? "critical" : index % 3 === 0 ? "high" : "medium",
  status: index % 5 === 0 ? "resolved" : index % 2 ? "open" : "investigating",
  service: index % 2 ? "docs-api" : "ui-shell",
  occurrences: 10 + index,
  updatedAt: (index + 1) + "분 전"
}));

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
    selectable: true,
    rowSelectionMode: "multiple",
    sortable: true,
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
        data={args.virtualized ? virtualizationRows : rows}
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
              className="border-default h-9 w-[220px] rounded-[var(--radius-md)] border bg-surface px-3 text-sm"
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

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const nextArgs = {
      ...(args as Record<string, unknown>),
      ...({"isLoading":true} as Record<string, unknown>)
    } as typeof args;

    return (
      <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-body-md text-foreground font-semibold">상태</h3>
          <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
            DataTable
          </span>
        </div>
        <p className="text-body-sm text-muted">핵심 상태 옵션을 적용한 실제 동작 예시입니다.</p>
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          {Playground.render ? Playground.render(nextArgs) : null}
        </div>
      </section>
    );
  }
};


export const OptionMatrix: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const nextArgs = {
      ...(args as Record<string, unknown>),
      ...({"tableDensity":"compact","striped":true} as Record<string, unknown>)
    } as typeof args;

    return (
      <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-body-md text-foreground font-semibold">옵션 매트릭스</h3>
          <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
            DataTable
          </span>
        </div>
        <p className="text-body-sm text-muted">주요 옵션 조합을 적용한 대표 예시입니다.</p>
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          {Playground.render ? Playground.render(nextArgs) : null}
        </div>
      </section>
    );
  }
};


export const Examples: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const nextArgs = {
      ...(args as Record<string, unknown>),
      ...({"stickyHeader":true,"striped":true} as Record<string, unknown>)
    } as typeof args;

    return (
      <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-body-md text-foreground font-semibold">사용 예시</h3>
          <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
            DataTable
          </span>
        </div>
        <p className="text-body-sm text-muted">실사용 시나리오 중심의 예시입니다.</p>
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          {Playground.render ? Playground.render(nextArgs) : null}
        </div>
      </section>
    );
  }
};
