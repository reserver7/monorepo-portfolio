import type * as React from "react";
import type { PaginationItemStyle } from "../pagination";

export type DataTableDensity = "compact" | "default" | "comfortable";
export type DataTableSortDirection = "asc" | "desc";
export type DataTableSortState = { id: string; direction: DataTableSortDirection } | null;
export type DataTableTextAlign = "left" | "center" | "right";
export type DataTableColumnFixed = "left" | "right";
export type DataTableVirtualizationMode = "paged" | "infinite";
export type DataTableFilterPrimitive = string | number | boolean | null;
export type DataTableFilterValue = DataTableFilterPrimitive | DataTableFilterPrimitive[];
export type DataTableFilterState = Record<string, DataTableFilterValue | undefined>;

export type DataTableQueryState = {
  page: number;
  pageSize: number;
  sort: DataTableSortState;
  filters: DataTableFilterState;
};

export type DataTableToolbarContext<T> = {
  query: DataTableQueryState;
  setFilters: (filters: DataTableFilterState) => void;
  resetFilters: () => void;
  setSort: (sort: DataTableSortState) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  selectedRowKeys: string[];
  setColumnVisibility: (visibility: Record<string, boolean>) => void;
  setColumnOrder: (order: string[]) => void;
  setColumnWidths: (widths: Record<string, number>) => void;
  rows: Array<DataTableRowMeta<T>>;
};

export type DataTableRowMeta<T> = {
  original: T;
  index: number;
  key: string;
  isLast: boolean;
};

export type DataTableCellContext<T> = {
  row: DataTableRowMeta<T>;
  value: unknown;
};

export type DataTableColumnDef<T> = {
  id?: string;
  accessorKey?: keyof T | string;
  header?: React.ReactNode | ((ctx: { column: { id: string } }) => React.ReactNode);
  cell?: (ctx: { row: { original: T }; getValue: () => unknown }) => React.ReactNode;
  render?: (ctx: DataTableCellContext<T>) => React.ReactNode;
  align?: DataTableTextAlign;
  fixed?: DataTableColumnFixed;
  headerClassName?: string;
  cellClassName?: string | ((ctx: DataTableCellContext<T>) => string | undefined);
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | boolean | Date | null | undefined;
};

export interface DataTableProps<T> {
  className?: string;
  style?: React.CSSProperties;
  columns: Array<DataTableColumnDef<T>>;
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  errorTitle?: string;
  tableClassName?: string;
  tableDensity?: DataTableDensity;
  stickyHeader?: boolean;
  striped?: boolean;
  virtualized?: boolean;
  virtualizationMode?: DataTableVirtualizationMode;
  virtualRowHeight?: number;
  virtualOverscan?: number;
  manualPagination?: boolean;
  enablePagination?: boolean;
  page?: number;
  totalPages?: number;
  totalCount?: number;
  pageSize?: number;
  defaultPageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  toolbar?: React.ReactNode | ((ctx: DataTableToolbarContext<T>) => React.ReactNode);
  toolbarPosition?: "top" | "bottom";
  showPaginationTotal?: boolean;
  showPageInfo?: boolean;
  showPageSizeSelector?: boolean;
  showQuickJumper?: boolean;
  showFirstLast?: boolean;
  hidePaginationOnSinglePage?: boolean;
  paginationItemStyle?: PaginationItemStyle;
  paginationAlign?: "left" | "center" | "right";
  columnDivider?: boolean;
  headerTextAlign?: DataTableTextAlign;
  cellTextAlign?: DataTableTextAlign;
  rowClassName?:
    | string
    | ((ctx: { row: DataTableRowMeta<T>; selected: boolean }) => string | undefined);
  onRowClick?: (ctx: { row: DataTableRowMeta<T>; selected: boolean }) => void;
  selectable?: boolean;
  rowSelectionMode?: "single" | "multiple";
  selectedRowKeys?: string[];
  defaultSelectedRowKeys?: string[];
  onSelectedRowKeysChange?: (selectedRowKeys: string[]) => void;
  sortable?: boolean;
  sortState?: DataTableSortState;
  defaultSortState?: DataTableSortState;
  onSortStateChange?: (sortState: DataTableSortState) => void;
  getRowId?: (row: T, index: number) => string;
  filters?: DataTableFilterState;
  defaultFilters?: DataTableFilterState;
  onFiltersChange?: (filters: DataTableFilterState) => void;
  filterFn?: (row: T, filters: DataTableFilterState) => boolean;
  onQueryChange?: (query: DataTableQueryState) => void;
  columnVisibility?: Record<string, boolean>;
  defaultColumnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  columnOrder?: string[];
  defaultColumnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  columnResizeEnabled?: boolean;
  defaultColumnWidth?: number;
  columnWidths?: Record<string, number>;
  defaultColumnWidths?: Record<string, number>;
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
}
