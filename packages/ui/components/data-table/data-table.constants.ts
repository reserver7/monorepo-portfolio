import type { DataTableDensity } from "./data-table.types";

export const DATA_TABLE_DENSITIES = ["compact", "default", "comfortable"] as const;

export const DATA_TABLE_DEFAULTS = {
  loadingMessage: "데이터를 불러오는 중...",
  emptyTitle: "데이터가 없습니다.",
  errorTitle: "조회에 실패했습니다.",
  tableDensity: "default" as DataTableDensity,
  stickyHeader: false,
  striped: false,
  virtualized: false,
  virtualizationMode: "paged" as const,
  virtualRowHeight: 44,
  virtualOverscan: 6,
  manualPagination: false,
  enablePagination: true,
  page: 1,
  totalPages: 1,
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
  paginationAlign: "center" as const,
  columnDivider: false,
  headerTextAlign: "center" as const,
  cellTextAlign: "center" as const,
  selectable: false,
  rowSelectionMode: "multiple" as const,
  sortable: false,
  columnResizeEnabled: false,
  defaultColumnWidth: 160
} as const;
