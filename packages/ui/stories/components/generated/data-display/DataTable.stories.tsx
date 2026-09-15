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
  render: (args) => (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">상태</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          DataTable
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">기본</div>
            <DataTable
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">columnDivider</div>
            <DataTable
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              columnDivider
             />
          </div>
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">columnResizeEnabled</div>
            <DataTable
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              columnResizeEnabled
             />
          </div>
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">enablePagination</div>
            <DataTable
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              enablePagination
             />
          </div>
      </div>
    </section>
  )
};


const OPTION_MATRIX = {
  "cellTextAlign": [
    "left",
    "center",
    "right"
  ],
  "headerTextAlign": [
    "left",
    "center",
    "right"
  ]
} as const;

const sanitizeMatrixArgs = (args: Record<string, unknown>) => {
  const next = sanitizeStoryArgs(args);
  delete next.children;
  delete next.leftIcon;
  delete next.rightIcon;
  return next;
};

export const OptionMatrix: Story = {
  render: (args) => (
    <div className="space-y-4">
      <section className="rounded-[var(--radius-xl)] border border-default bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-body-md text-foreground font-semibold">옵션 매트릭스</h3>
          <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
            DataTable
          </span>
        </div>
        <div className="space-y-4">
          {Object.entries(OPTION_MATRIX).map(([propName, values]) => (
            <article key={propName} className="rounded-[var(--radius-lg)] border border-default bg-surface-elevated p-3">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-body-sm text-foreground font-medium">{propName}</h4>
                <span className="text-caption text-muted">{values.length} options</span>
              </div>
              <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {(values as readonly unknown[]).map((value) => (
                  <div key={`${propName}-${String(value)}`} className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
                    <div className="text-caption text-muted mb-2">{String(value)}</div>
                    <div className="min-h-10">
                      <DataTable
                        {...sanitizeMatrixArgs(args as Record<string, unknown>)}
                        {...({ [propName]: value } as Record<string, unknown>)}
                       />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
          <div className="text-caption text-muted">
            Playground controls와 함께 사용해서 옵션 조합을 추가 검증하세요.
          </div>
        </div>
      </section>
    </div>
  )
};


export const Examples: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">사용 예시</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          DataTable
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-2">기본 사용</div>
          <div className="min-h-10">
            <DataTable
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-1">레이아웃 배치 예시</div>
          <div className="text-caption text-muted mb-2">실제 화면 배치에서 기본 상태를 검증합니다.</div>
          <div className="min-h-10">
            <DataTable
                {...sanitizeStoryArgs(args as Record<string, unknown>)}
               />
          </div>
        </div>
      </div>
    </section>
  )
};

