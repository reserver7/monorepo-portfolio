"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "../cn";
import { Pagination } from "../pagination";
import { Spinner } from "../spinner";
import { StateView } from "../state-view";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import { DATA_TABLE_DEFAULTS } from "./data-table.constants";
import { useDataTablePageInfo } from "./data-table.hooks";
import type {
  DataTableCellContext,
  DataTableFilterState,
  DataTableProps,
  DataTableSortState,
  DataTableTextAlign,
  DataTableToolbarContext
} from "./data-table.types";

const TableSelectCheckbox = React.memo(function TableSelectCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  const ref = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="h-4 w-4 rounded border-default accent-primary"
      checked={checked}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
  );
});

const toSortableValue = (value: unknown): string | number => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value == null) return "";
  return String(value);
};

const toTextAlignClass = (textAlign: DataTableTextAlign) =>
  textAlign === "center" ? "text-center" : textAlign === "right" ? "text-right" : "text-left";

const resolveColumnWidth = (width: number | string | undefined, fallback: number): number => {
  if (typeof width === "number") return width;
  return fallback;
};

const areSameOrder = (a: string[], b: string[]): boolean => a.length === b.length && a.every((value, index) => value === b[index]);

export const DataTableColumnHeader = React.memo(function DataTableColumnHeader({ title }: { column?: { id: string }; title: string }) {
  return <span className="text-foreground text-xs font-semibold">{title}</span>;
});
DataTableColumnHeader.displayName = "DataTableColumnHeader";

const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "button, a, input, textarea, select, label, [data-no-row-select='true'], [role='button'], [role='link'], [contenteditable='true']"
    )
  );
};

type InternalDataTableCell = {
  id: string;
  rendered: React.ReactNode;
  context: DataTableCellContext<unknown>;
  column: {
    align?: DataTableTextAlign;
    fixed?: "left" | "right";
    cellClassName?: string | ((ctx: DataTableCellContext<unknown>) => string | undefined);
  };
};

type InternalDataTableRow = {
  key: string;
  rowIndex: number;
  rowContext: {
    original: unknown;
    index: number;
    key: string;
    isLast: boolean;
  };
  cells: InternalDataTableCell[];
};

type InternalColumnViewModel = {
  id: string;
  cellAlignClass: string;
  cellStyle: React.CSSProperties;
};

const DataTableRowItem = React.memo(function DataTableRowItem({
  row,
  rowSelected,
  selectable,
  striped,
  rowClassName,
  onActivateRow,
  onToggleRow,
  columnDivider,
  columnViewModelById,
  fallbackCellAlignClass
}: {
  row: InternalDataTableRow;
  rowSelected: boolean;
  selectable: boolean;
  striped: boolean;
  rowClassName?: string | ((ctx: { row: InternalDataTableRow["rowContext"]; selected: boolean }) => string | undefined);
  onActivateRow: (event: React.MouseEvent<HTMLTableRowElement>, row: InternalDataTableRow) => void;
  onToggleRow: (rowKey: string, checked: boolean) => void;
  columnDivider: boolean;
  columnViewModelById: Map<string, InternalColumnViewModel>;
  fallbackCellAlignClass: string;
}) {
  return (
    <TableRow
      key={row.key}
      className={cn(
        "last:border-none",
        selectable && "cursor-pointer",
        striped && row.rowIndex % 2 === 1 && "bg-surface-elevated/30",
        selectable && rowSelected && "bg-primary/10 hover:bg-primary/20",
        typeof rowClassName === "function" ? rowClassName({ row: row.rowContext, selected: rowSelected }) : rowClassName
      )}
      aria-selected={selectable ? rowSelected : undefined}
      onClick={(event) => onActivateRow(event, row)}
    >
      {selectable ? (
        <TableCell className={cn("w-11 px-3 text-center", rowSelected && "bg-primary/10", columnDivider && "border-default border-r")}>
          <div className="flex items-center justify-center" data-no-row-select="true">
            <TableSelectCheckbox checked={rowSelected} onChange={(checked) => onToggleRow(row.key, checked)} />
          </div>
        </TableCell>
      ) : null}
      {row.cells.map((cell) => {
        const viewModel = columnViewModelById.get(cell.id);
        const alignClass = viewModel?.cellAlignClass ?? fallbackCellAlignClass;
        const resolvedCellClassName =
          typeof cell.column.cellClassName === "function" ? cell.column.cellClassName(cell.context) : cell.column.cellClassName;
        return (
          <TableCell
            key={`${row.key}-${cell.id}`}
            className={cn(
              "text-foreground px-3 align-middle",
              alignClass,
              columnDivider && "border-default border-r last:border-r-0",
              rowSelected && "bg-primary/10",
              cell.column.fixed && (rowSelected ? "bg-primary/10" : "bg-surface"),
              resolvedCellClassName
            )}
            style={viewModel?.cellStyle}
          >
            {cell.rendered ?? "-"}
          </TableCell>
        );
      })}
    </TableRow>
  );
}, (prev, next) => {
  return (
    prev.row === next.row &&
    prev.rowSelected === next.rowSelected &&
    prev.selectable === next.selectable &&
    prev.striped === next.striped &&
    prev.rowClassName === next.rowClassName &&
    prev.onActivateRow === next.onActivateRow &&
    prev.onToggleRow === next.onToggleRow &&
    prev.columnDivider === next.columnDivider &&
    prev.columnViewModelById === next.columnViewModelById &&
    prev.fallbackCellAlignClass === next.fallbackCellAlignClass
  );
});
DataTableRowItem.displayName = "DataTableRowItem";

export function DataTable<T>({
  className,
  style,
  columns,
  data,
  isLoading,
  isError,
  emptyTitle = DATA_TABLE_DEFAULTS.emptyTitle,
  errorTitle = DATA_TABLE_DEFAULTS.errorTitle,
  tableClassName,
  tableDensity = DATA_TABLE_DEFAULTS.tableDensity,
  stickyHeader = DATA_TABLE_DEFAULTS.stickyHeader,
  striped = DATA_TABLE_DEFAULTS.striped,
  virtualized = DATA_TABLE_DEFAULTS.virtualized,
  virtualizationMode = DATA_TABLE_DEFAULTS.virtualizationMode,
  virtualRowHeight = DATA_TABLE_DEFAULTS.virtualRowHeight,
  virtualOverscan = DATA_TABLE_DEFAULTS.virtualOverscan,
  sortable = DATA_TABLE_DEFAULTS.sortable,
  manualPagination = DATA_TABLE_DEFAULTS.manualPagination,
  enablePagination = DATA_TABLE_DEFAULTS.enablePagination,
  page,
  totalPages,
  totalCount,
  pageSize,
  defaultPageSize = DATA_TABLE_DEFAULTS.defaultPageSize,
  pageSizeOptions = DATA_TABLE_DEFAULTS.pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  toolbar,
  toolbarPosition = "top",
  showPaginationTotal,
  showPageInfo,
  showPageSizeSelector,
  showQuickJumper,
  showFirstLast,
  hidePaginationOnSinglePage,
  paginationItemStyle = "minimal",
  paginationAlign = DATA_TABLE_DEFAULTS.paginationAlign,
  columnDivider = DATA_TABLE_DEFAULTS.columnDivider,
  headerTextAlign = DATA_TABLE_DEFAULTS.headerTextAlign,
  cellTextAlign = DATA_TABLE_DEFAULTS.cellTextAlign,
  rowClassName,
  onRowClick,
  selectable = DATA_TABLE_DEFAULTS.selectable,
  rowSelectionMode = DATA_TABLE_DEFAULTS.rowSelectionMode,
  selectedRowKeys,
  defaultSelectedRowKeys = [],
  onSelectedRowKeysChange,
  sortState,
  defaultSortState = null,
  onSortStateChange,
  getRowId,
  filters,
  defaultFilters = {},
  onFiltersChange,
  filterFn,
  onQueryChange,
  columnVisibility,
  defaultColumnVisibility = {},
  onColumnVisibilityChange,
  columnOrder,
  defaultColumnOrder = [],
  onColumnOrderChange,
  columnResizeEnabled = DATA_TABLE_DEFAULTS.columnResizeEnabled,
  defaultColumnWidth = DATA_TABLE_DEFAULTS.defaultColumnWidth,
  columnWidths,
  defaultColumnWidths = {},
  onColumnWidthsChange
}: DataTableProps<T>) {
  const tableContainerRef = React.useRef<HTMLDivElement | null>(null);
  const isPageControlled = page !== undefined;
  const [internalPage, setInternalPage] = React.useState(() => Math.max(1, DATA_TABLE_DEFAULTS.page));
  const currentPage = Math.max(1, isPageControlled ? page : internalPage);

  const isPageSizeControlled = pageSize !== undefined;
  const [internalPageSize, setInternalPageSize] = React.useState(() => Math.max(1, defaultPageSize));
  const currentPageSize = Math.max(1, isPageSizeControlled ? pageSize : internalPageSize);

  const isSortControlled = sortState !== undefined;
  const [internalSortState, setInternalSortState] = React.useState<DataTableSortState>(defaultSortState);
  const currentSortState = isSortControlled ? sortState : internalSortState;

  const isFiltersControlled = filters !== undefined;
  const [internalFilters, setInternalFilters] = React.useState<DataTableFilterState>(defaultFilters);
  const currentFilters = isFiltersControlled ? filters : internalFilters;
  const deferredFilters = React.useDeferredValue(currentFilters);

  const isSelectionControlled = selectedRowKeys !== undefined;
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = React.useState<string[]>(defaultSelectedRowKeys);
  const currentSelectedRowKeys = isSelectionControlled ? selectedRowKeys : internalSelectedRowKeys;
  const currentSelectedRowKeysRef = React.useRef<string[]>(currentSelectedRowKeys);

  const isColumnVisibilityControlled = columnVisibility !== undefined;
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<Record<string, boolean>>(defaultColumnVisibility);
  const currentColumnVisibility = isColumnVisibilityControlled ? columnVisibility : internalColumnVisibility;

  const isColumnOrderControlled = columnOrder !== undefined;
  const [internalColumnOrder, setInternalColumnOrder] = React.useState<string[]>(defaultColumnOrder);
  const currentColumnOrder = isColumnOrderControlled ? columnOrder : internalColumnOrder;

  const isColumnWidthsControlled = columnWidths !== undefined;
  const [internalColumnWidths, setInternalColumnWidths] = React.useState<Record<string, number>>(defaultColumnWidths);
  const currentColumnWidths = isColumnWidthsControlled ? columnWidths : internalColumnWidths;
  const currentColumnWidthsRef = React.useRef<Record<string, number>>(currentColumnWidths);
  const [virtualScrollTop, setVirtualScrollTop] = React.useState(0);
  const [virtualViewportHeight, setVirtualViewportHeight] = React.useState(0);

  React.useEffect(() => {
    currentColumnWidthsRef.current = currentColumnWidths;
  }, [currentColumnWidths]);

  React.useEffect(() => {
    currentSelectedRowKeysRef.current = currentSelectedRowKeys;
  }, [currentSelectedRowKeys]);

  React.useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    setVirtualViewportHeight(container.clientHeight);

    let frameId = 0;
    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        setVirtualScrollTop(container.scrollTop);
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      setVirtualViewportHeight(container.clientHeight);
    });

    container.addEventListener("scroll", handleScroll, { passive: true });
    resizeObserver.observe(container);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const updateSelectedRowKeys = React.useCallback(
    (nextSelectedRowKeys: string[]) => {
      if (!isSelectionControlled) setInternalSelectedRowKeys(nextSelectedRowKeys);
      onSelectedRowKeysChange?.(nextSelectedRowKeys);
    },
    [isSelectionControlled, onSelectedRowKeysChange]
  );

  const updateSortState = React.useCallback(
    (nextSortState: DataTableSortState) => {
      if (!isSortControlled) setInternalSortState(nextSortState);
      onSortStateChange?.(nextSortState);
    },
    [isSortControlled, onSortStateChange]
  );

  const updateFilters = React.useCallback(
    (nextFilters: DataTableFilterState) => {
      if (!isFiltersControlled) setInternalFilters(nextFilters);
      onFiltersChange?.(nextFilters);
    },
    [isFiltersControlled, onFiltersChange]
  );

  const updateColumnWidths = React.useCallback(
    (nextWidths: Record<string, number>) => {
      if (!isColumnWidthsControlled) setInternalColumnWidths(nextWidths);
      onColumnWidthsChange?.(nextWidths);
    },
    [isColumnWidthsControlled, onColumnWidthsChange]
  );

  const normalizedColumns = React.useMemo(
    () =>
      columns.map((column, index) => ({
        ...column,
        __id: column.id ?? String(column.accessorKey ?? index),
        __sortable: column.sortable ?? (sortable && (column.accessorKey !== undefined || column.sortAccessor !== undefined))
      })),
    [columns, sortable]
  );
  const normalizedColumnById = React.useMemo(
    () => new Map(normalizedColumns.map((column) => [column.__id, column])),
    [normalizedColumns]
  );

  React.useEffect(() => {
    const allIds = normalizedColumns.map((column) => column.__id);
    const baseOrder = (currentColumnOrder?.length ? currentColumnOrder : defaultColumnOrder).filter((id) => allIds.includes(id));
    const missing = allIds.filter((id) => !baseOrder.includes(id));
    const nextOrder = [...baseOrder, ...missing];
    if (!isColumnOrderControlled) {
      setInternalColumnOrder((prev) => (areSameOrder(prev, nextOrder) ? prev : nextOrder));
      return;
    }
    if (!areSameOrder(currentColumnOrder ?? [], nextOrder)) {
      onColumnOrderChange?.(nextOrder);
    }
  }, [currentColumnOrder, defaultColumnOrder, isColumnOrderControlled, normalizedColumns, onColumnOrderChange]);

  React.useEffect(() => {
    const allIds = normalizedColumns.map((column) => column.__id);
    const mergedVisibility: Record<string, boolean> = { ...defaultColumnVisibility, ...currentColumnVisibility };
    let changed = false;
    allIds.forEach((id) => {
      if (mergedVisibility[id] === undefined) {
        mergedVisibility[id] = true;
        changed = true;
      }
    });
    if (!changed) return;
    if (!isColumnVisibilityControlled) {
      setInternalColumnVisibility(mergedVisibility);
      return;
    }
    onColumnVisibilityChange?.(mergedVisibility);
  }, [
    currentColumnVisibility,
    defaultColumnVisibility,
    isColumnVisibilityControlled,
    normalizedColumns,
    onColumnVisibilityChange
  ]);

  const normalizedOrderedColumns = React.useMemo(() => {
    const orderedIds = currentColumnOrder?.length
      ? currentColumnOrder
      : normalizedColumns.map((column) => column.__id);
    const base = orderedIds.map((id) => normalizedColumnById.get(id)).filter(Boolean) as typeof normalizedColumns;
    const missing = normalizedColumns.filter((column) => !orderedIds.includes(column.__id));
    return [...base, ...missing];
  }, [currentColumnOrder, normalizedColumnById, normalizedColumns]);

  const visibleColumns = React.useMemo(() => {
    return normalizedOrderedColumns.filter((column) => currentColumnVisibility[column.__id] !== false);
  }, [currentColumnVisibility, normalizedOrderedColumns]);

  const rowsWithMeta = React.useMemo(
    () =>
      data.map((row, index) => ({
        original: row,
        rowKey: getRowId ? getRowId(row, index) : String(index)
      })),
    [data, getRowId]
  );

  const filteredRowsWithMeta = React.useMemo(() => {
    if (!filterFn) return rowsWithMeta;
    return rowsWithMeta.filter((rowMeta) => filterFn(rowMeta.original, deferredFilters));
  }, [deferredFilters, filterFn, rowsWithMeta]);

  const sortedRowsWithMeta = React.useMemo(() => {
    if (!currentSortState) return filteredRowsWithMeta;
    const targetColumn = normalizedColumnById.get(currentSortState.id);
    if (!targetColumn || !targetColumn.__sortable) return filteredRowsWithMeta;

    const directionMultiplier = currentSortState.direction === "asc" ? 1 : -1;

    const nextRows = [...filteredRowsWithMeta];
    nextRows.sort((a, b) => {
      const aValue = targetColumn.sortAccessor
        ? targetColumn.sortAccessor(a.original)
        : targetColumn.accessorKey
          ? (a.original as Record<string, unknown>)[String(targetColumn.accessorKey)]
          : undefined;
      const bValue = targetColumn.sortAccessor
        ? targetColumn.sortAccessor(b.original)
        : targetColumn.accessorKey
          ? (b.original as Record<string, unknown>)[String(targetColumn.accessorKey)]
          : undefined;

      const normalizedA = toSortableValue(aValue);
      const normalizedB = toSortableValue(bValue);

      if (typeof normalizedA === "number" && typeof normalizedB === "number") {
        return (normalizedA - normalizedB) * directionMultiplier;
      }
      return String(normalizedA).localeCompare(String(normalizedB), "ko", { numeric: true }) * directionMultiplier;
    });
    return nextRows;
  }, [currentSortState, filteredRowsWithMeta, normalizedColumnById]);

  const resolvedTotalCount = typeof totalCount === "number" ? totalCount : sortedRowsWithMeta.length;
  const calculatedTotalPages = Math.max(1, Math.ceil(resolvedTotalCount / Math.max(1, currentPageSize)));
  const safeTotalPages = Math.max(1, totalPages ?? calculatedTotalPages);
  const pageInfo = useDataTablePageInfo(currentPage, safeTotalPages, resolvedTotalCount);
  const isVirtualInfiniteMode = virtualized && virtualizationMode === "infinite";

  React.useEffect(() => {
    if (isPageControlled) return;
    if (currentPage <= safeTotalPages) return;
    setInternalPage(safeTotalPages);
  }, [currentPage, isPageControlled, safeTotalPages]);

  const pagedRowsWithMeta = React.useMemo(() => {
    if (manualPagination || isVirtualInfiniteMode) return sortedRowsWithMeta;
    const start = (pageInfo.safePage - 1) * currentPageSize;
    const end = start + currentPageSize;
    return sortedRowsWithMeta.slice(start, end);
  }, [currentPageSize, isVirtualInfiniteMode, manualPagination, pageInfo.safePage, sortedRowsWithMeta]);

  const rows = React.useMemo(() => {
    const lastIndex = Math.max(0, pagedRowsWithMeta.length - 1);
    return pagedRowsWithMeta.map((rowMeta, rowIndex) => {
      const rowContext = {
        original: rowMeta.original,
        index: rowIndex,
        key: rowMeta.rowKey,
        isLast: rowIndex === lastIndex
      };
      const cells = visibleColumns.map((column, colIndex) => {
        const id = column.__id ?? String(colIndex);
        const rawValue = column.accessorKey
          ? (rowMeta.original as Record<string, unknown>)[String(column.accessorKey)]
          : undefined;
        const context: DataTableCellContext<T> = { row: rowContext, value: rawValue };
        const rendered = column.render
          ? column.render(context)
          : column.cell
            ? column.cell({ row: { original: rowMeta.original }, getValue: () => rawValue })
            : (rawValue as React.ReactNode);
        return { id, rendered, rawValue, context, column };
      });
      return { key: rowMeta.rowKey, rowIndex, original: rowMeta.original, cells, rowContext };
    });
  }, [pagedRowsWithMeta, visibleColumns]);
  const colSpan = Math.max(1, visibleColumns.length + (selectable ? 1 : 0));
  const paginationAlignClass =
    paginationAlign === "left"
      ? "justify-start"
      : paginationAlign === "center"
        ? "justify-center"
        : "justify-end";
  const shouldRenderPagination = enablePagination && !isVirtualInfiniteMode;
  const selectedRowKeySet = React.useMemo(() => new Set(currentSelectedRowKeys), [currentSelectedRowKeys]);
  const selectedRowKeySetRef = React.useRef<Set<string>>(selectedRowKeySet);
  React.useEffect(() => {
    selectedRowKeySetRef.current = selectedRowKeySet;
  }, [selectedRowKeySet]);
  const visibleRowKeys = React.useMemo(() => rows.map((row) => row.key), [rows]);
  const allVisibleSelected = visibleRowKeys.length > 0 && visibleRowKeys.every((key) => selectedRowKeySet.has(key));
  const someVisibleSelected = visibleRowKeys.some((key) => selectedRowKeySet.has(key)) && !allVisibleSelected;

  const columnWidthsById = React.useMemo(() => {
    const entries = visibleColumns.map((column) => {
      const width = currentColumnWidths[column.__id];
      const resolved = resolveColumnWidth(width ?? column.width, defaultColumnWidth);
      const minWidth = column.minWidth ?? 80;
      const maxWidth = column.maxWidth ?? 1200;
      return [column.__id, Math.min(Math.max(resolved, minWidth), maxWidth)] as const;
    });
    return Object.fromEntries(entries);
  }, [currentColumnWidths, defaultColumnWidth, visibleColumns]);

  const stickyOffsets = React.useMemo(() => {
    const left: Record<string, number> = {};
    const right: Record<string, number> = {};
    let leftAcc = 0;
    let rightAcc = 0;
    visibleColumns.forEach((column) => {
      if (column.fixed === "left") {
        left[column.__id] = leftAcc;
        leftAcc += columnWidthsById[column.__id] ?? defaultColumnWidth;
      }
    });
    [...visibleColumns].reverse().forEach((column) => {
      if (column.fixed === "right") {
        right[column.__id] = rightAcc;
        rightAcc += columnWidthsById[column.__id] ?? defaultColumnWidth;
      }
    });
    return { left, right };
  }, [columnWidthsById, defaultColumnWidth, visibleColumns]);

  const getStickyStyles = React.useCallback(
    (columnId: string, fixed: "left" | "right" | undefined, isHeader: boolean): React.CSSProperties => {
      const width = columnWidthsById[columnId] ?? defaultColumnWidth;
      const base: React.CSSProperties = { width, minWidth: width, maxWidth: width };
      if (!fixed) return base;
      if (fixed === "left") {
        return { ...base, position: "sticky", left: stickyOffsets.left[columnId] ?? 0, zIndex: isHeader ? 6 : 4 };
      }
      return { ...base, position: "sticky", right: stickyOffsets.right[columnId] ?? 0, zIndex: isHeader ? 6 : 4 };
    },
    [columnWidthsById, defaultColumnWidth, stickyOffsets.left, stickyOffsets.right]
  );

  const columnViewModels = React.useMemo(
    () =>
      visibleColumns.map((column) => {
        const id = column.__id;
        const headerAlignClass = toTextAlignClass(column.align ?? headerTextAlign);
        const cellAlignClass = toTextAlignClass(column.align ?? cellTextAlign);
        const canResize = columnResizeEnabled && column.resizable !== false;
        return {
          column,
          id,
          headerAlignClass,
          cellAlignClass,
          canResize,
          headerStyle: getStickyStyles(id, column.fixed, true),
          cellStyle: getStickyStyles(id, column.fixed, false)
        };
      }),
    [cellTextAlign, columnResizeEnabled, getStickyStyles, headerTextAlign, visibleColumns]
  );
  const columnViewModelById = React.useMemo(
    () => new Map(columnViewModels.map((viewModel) => [viewModel.id, viewModel])),
    [columnViewModels]
  );
  const fallbackCellAlignClass = React.useMemo(() => toTextAlignClass(cellTextAlign), [cellTextAlign]);

  const handlePageChange = React.useCallback(
    (nextPage: number) => {
      if (!isPageControlled) setInternalPage(nextPage);
      onPageChange?.(nextPage);
    },
    [isPageControlled, onPageChange]
  );

  const handlePageSizeChange = React.useCallback(
    (nextPageSize: number) => {
      if (!isPageSizeControlled) setInternalPageSize(nextPageSize);
      if (!isPageControlled) setInternalPage(1);
      onPageSizeChange?.(nextPageSize);
      onPageChange?.(1);
    },
    [isPageControlled, isPageSizeControlled, onPageChange, onPageSizeChange]
  );

  const handleFiltersChange = React.useCallback(
    (nextFilters: DataTableFilterState) => {
      updateFilters(nextFilters);
      if (!isPageControlled) setInternalPage(1);
      onPageChange?.(1);
    },
    [isPageControlled, onPageChange, updateFilters]
  );

  const handleResizeStart = React.useCallback(
    (event: React.MouseEvent<HTMLSpanElement>, columnId: string, minWidth = 80, maxWidth = 1200) => {
      event.preventDefault();
      event.stopPropagation();
      const initialX = event.clientX;
      const initialWidth = columnWidthsById[columnId] ?? defaultColumnWidth;
      let rafId: number | null = null;
      let pendingWidth = initialWidth;

      const flushWidth = () => {
        rafId = null;
        const base = currentColumnWidthsRef.current;
        if (base[columnId] === pendingWidth) return;
        updateColumnWidths({
          ...base,
          [columnId]: pendingWidth
        });
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - initialX;
        pendingWidth = Math.min(Math.max(initialWidth + delta, minWidth), maxWidth);
        if (rafId != null) return;
        rafId = window.requestAnimationFrame(flushWidth);
      };

      const handleMouseUp = () => {
        if (rafId != null) {
          window.cancelAnimationFrame(rafId);
          flushWidth();
        }
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [columnWidthsById, defaultColumnWidth, updateColumnWidths]
  );

  const handleToggleSort = React.useCallback(
    (columnId: string) => {
      const column = normalizedColumnById.get(columnId);
      if (!column || !column.__sortable) return;
      if (!currentSortState || currentSortState.id !== columnId) {
        updateSortState({ id: columnId, direction: "asc" });
        return;
      }
      if (currentSortState.direction === "asc") {
        updateSortState({ id: columnId, direction: "desc" });
        return;
      }
      updateSortState(null);
    },
    [currentSortState, normalizedColumnById, updateSortState]
  );

  const handleToggleSelectAll = React.useCallback(
    (checked: boolean) => {
      if (rowSelectionMode === "single") return;
      const current = currentSelectedRowKeysRef.current;
      if (checked) {
        const next = Array.from(new Set([...current, ...visibleRowKeys]));
        updateSelectedRowKeys(next);
        return;
      }
      const visibleKeySet = new Set(visibleRowKeys);
      updateSelectedRowKeys(current.filter((key) => !visibleKeySet.has(key)));
    },
    [rowSelectionMode, updateSelectedRowKeys, visibleRowKeys]
  );

  const handleToggleRow = React.useCallback(
    (rowKey: string, checked: boolean) => {
      if (rowSelectionMode === "single") {
        updateSelectedRowKeys(checked ? [rowKey] : []);
        return;
      }
      const current = currentSelectedRowKeysRef.current;
      if (checked) {
        updateSelectedRowKeys(Array.from(new Set([...current, rowKey])));
        return;
      }
      updateSelectedRowKeys(current.filter((key) => key !== rowKey));
    },
    [rowSelectionMode, updateSelectedRowKeys]
  );

  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableRowElement>, rowData: (typeof rows)[number]) => {
      if (isInteractiveTarget(event.target)) return;
      const isSelected = selectedRowKeySetRef.current.has(rowData.key);
      const nextSelected = selectable ? !isSelected : isSelected;
      if (selectable) {
        handleToggleRow(rowData.key, nextSelected);
      }
      onRowClick?.({ row: rowData.rowContext, selected: nextSelected });
    },
    [handleToggleRow, onRowClick, selectable]
  );

  React.useEffect(() => {
    if (!onQueryChange) return;
    onQueryChange({
      page: isVirtualInfiniteMode ? 1 : pageInfo.safePage,
      pageSize: currentPageSize,
      sort: currentSortState,
      filters: currentFilters
    });
  }, [currentFilters, currentPageSize, currentSortState, isVirtualInfiniteMode, onQueryChange, pageInfo.safePage]);

  const rowMetas = React.useMemo(() => rows.map((row) => row.rowContext), [rows]);
  const virtualizationActive = virtualized && !isLoading && !isError && rows.length > 0;
  const safeVirtualRowHeight = Math.max(24, Math.floor(virtualRowHeight));
  const safeVirtualOverscan = Math.max(0, Math.floor(virtualOverscan));
  const virtualRange = React.useMemo(() => {
    if (!virtualizationActive) {
      return { start: 0, end: rows.length, topPadding: 0, bottomPadding: 0 };
    }
    const viewport = Math.max(1, virtualViewportHeight || 1);
    const visibleCount = Math.ceil(viewport / safeVirtualRowHeight);
    const start = Math.max(0, Math.floor(virtualScrollTop / safeVirtualRowHeight) - safeVirtualOverscan);
    const end = Math.min(rows.length, start + visibleCount + safeVirtualOverscan * 2);
    const topPadding = start * safeVirtualRowHeight;
    const bottomPadding = Math.max(0, (rows.length - end) * safeVirtualRowHeight);
    return { start, end, topPadding, bottomPadding };
  }, [rows.length, safeVirtualOverscan, safeVirtualRowHeight, virtualScrollTop, virtualViewportHeight, virtualizationActive]);
  const renderedRows = React.useMemo(
    () => (virtualizationActive ? rows.slice(virtualRange.start, virtualRange.end) : rows),
    [rows, virtualRange.end, virtualRange.start, virtualizationActive]
  );
  const toolbarContext = React.useMemo<DataTableToolbarContext<T>>(
    () => ({
      query: {
        page: isVirtualInfiniteMode ? 1 : pageInfo.safePage,
        pageSize: currentPageSize,
        sort: currentSortState,
        filters: currentFilters
      },
      setFilters: handleFiltersChange,
      resetFilters: () => handleFiltersChange({}),
      setSort: updateSortState,
      setPage: handlePageChange,
      setPageSize: handlePageSizeChange,
      selectedRowKeys: currentSelectedRowKeys,
      setColumnVisibility: (nextVisibility) => {
        if (!isColumnVisibilityControlled) setInternalColumnVisibility(nextVisibility);
        onColumnVisibilityChange?.(nextVisibility);
      },
      setColumnOrder: (nextOrder) => {
        if (!isColumnOrderControlled) setInternalColumnOrder(nextOrder);
        onColumnOrderChange?.(nextOrder);
      },
      setColumnWidths: updateColumnWidths,
      rows: rowMetas
    }),
    [
      currentFilters,
      currentPageSize,
      currentSelectedRowKeys,
      currentSortState,
      handleFiltersChange,
      handlePageChange,
      handlePageSizeChange,
      isColumnOrderControlled,
      isColumnVisibilityControlled,
      onColumnOrderChange,
      onColumnVisibilityChange,
      pageInfo.safePage,
      isVirtualInfiniteMode,
      rowMetas,
      updateColumnWidths,
      updateSortState
    ]
  );

  const renderedToolbar = React.useMemo(() => {
    if (!toolbar) return null;
    return typeof toolbar === "function" ? toolbar(toolbarContext) : toolbar;
  }, [toolbar, toolbarContext]);

  const paginationProps = React.useMemo(
    () => ({
      page: isVirtualInfiniteMode ? 1 : pageInfo.safePage,
      totalPages: pageInfo.safeTotalPages,
      totalItems: resolvedTotalCount,
      pageSize: currentPageSize,
      pageSizeOptions,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      itemStyle: paginationItemStyle,
      showPrevNext: true,
      ...(showFirstLast !== undefined ? { showFirstLast } : {}),
      ...(showPaginationTotal !== undefined ? { showTotal: showPaginationTotal } : {}),
      ...(showPageInfo !== undefined ? { showPageInfo } : {}),
      ...(showPageSizeSelector !== undefined ? { showPageSizeSelector } : {}),
      ...(showQuickJumper !== undefined ? { showQuickJumper } : {}),
      ...(hidePaginationOnSinglePage !== undefined ? { hideOnSinglePage: hidePaginationOnSinglePage } : {})
    }),
    [
      currentPageSize,
      handlePageChange,
      handlePageSizeChange,
      hidePaginationOnSinglePage,
      isVirtualInfiniteMode,
      pageInfo.safePage,
      pageInfo.safeTotalPages,
      pageSizeOptions,
      paginationItemStyle,
      resolvedTotalCount,
      showFirstLast,
      showPageInfo,
      showPageSizeSelector,
      showPaginationTotal,
      showQuickJumper
    ]
  );

  return (
    <div className={cn("space-y-3", className)} style={style}>
      {toolbarPosition === "top" && renderedToolbar ? <div className="px-1">{renderedToolbar}</div> : null}

      <div className="border-default bg-surface overflow-x-auto rounded-[var(--radius-xl)] border">
        <Table
          className={cn("min-w-full text-sm", tableClassName)}
          density={tableDensity}
          stickyHeader={stickyHeader}
          containerClassName="max-h-[70vh]"
          containerRef={tableContainerRef}
        >
          <TableHeader className="bg-surface-elevated">
            <TableRow>
              {selectable ? (
                <TableHead className={cn("w-11 px-3 text-center", columnDivider && "border-default border-r")}>
                  {rowSelectionMode === "multiple" ? (
                    <div className="flex items-center justify-center" data-no-row-select="true">
                      <TableSelectCheckbox
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected}
                        onChange={handleToggleSelectAll}
                      />
                    </div>
                  ) : null}
                </TableHead>
              ) : null}
              {columnViewModels.map((viewModel) => {
                const { column, id, headerAlignClass, canResize, headerStyle } = viewModel;
                const isActiveSort = currentSortState?.id === id;
                const sortDirection = isActiveSort ? currentSortState?.direction : null;
                const sortIcon = !column.__sortable ? null : sortDirection === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : sortDirection === "desc" ? (
                  <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUpDown className="h-4 w-4" />
                );

                return (
                  <TableHead
                    key={id}
                    className={cn(
                      "group relative px-3",
                      headerAlignClass,
                      columnDivider && "border-default border-r last:border-r-0",
                      column.fixed && "bg-surface-elevated",
                      column.headerClassName
                    )}
                    style={headerStyle}
                  >
                    {column.__sortable ? (
                      <button
                        type="button"
                        className={cn(
                          "inline-flex w-full items-center gap-1 transition-colors",
                          headerAlignClass === "text-right"
                            ? "justify-end"
                            : headerAlignClass === "text-center"
                              ? "justify-center"
                              : "justify-start",
                          "hover:text-foreground"
                        )}
                        onClick={() => handleToggleSort(id)}
                      >
                        <span>{typeof column.header === "function" ? column.header({ column: { id } }) : column.header}</span>
                        <span className="text-muted">{sortIcon}</span>
                      </button>
                    ) : (
                      typeof column.header === "function" ? column.header({ column: { id } }) : column.header
                    )}
                    {canResize ? (
                      <span
                        role="separator"
                        aria-label={`${id} 열 너비 조절`}
                        data-no-row-select="true"
                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 transition-opacity group-hover:opacity-100"
                        onMouseDown={(event) => handleResizeStart(event, id, column.minWidth, column.maxWidth)}
                      >
                        <span className="bg-border/70 absolute right-0 top-1/2 h-4 w-px -translate-y-1/2" />
                      </span>
                    ) : null}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-14">
                  <div className="flex items-center justify-center">
                    <Spinner open size="md" color="primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-8">
                  <StateView variant="error" size="sm" title={errorTitle} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-8">
                  <StateView variant="empty" size="sm" title={emptyTitle} />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {virtualizationActive && virtualRange.topPadding > 0 ? (
                  <TableRow aria-hidden="true">
                    <TableCell colSpan={colSpan} className="p-0" style={{ height: `${virtualRange.topPadding}px` }} />
                  </TableRow>
                ) : null}

                {renderedRows.map((row) => (
                <DataTableRowItem
                  key={row.key}
                  row={row as unknown as InternalDataTableRow}
                  rowSelected={selectedRowKeySet.has(row.key)}
                  selectable={selectable}
                  striped={striped}
                  rowClassName={
                    rowClassName as string | ((ctx: { row: InternalDataTableRow["rowContext"]; selected: boolean }) => string | undefined)
                  }
                  onActivateRow={handleRowClick as (event: React.MouseEvent<HTMLTableRowElement>, row: InternalDataTableRow) => void}
                  onToggleRow={handleToggleRow}
                  columnDivider={columnDivider}
                  columnViewModelById={columnViewModelById as unknown as Map<string, InternalColumnViewModel>}
                  fallbackCellAlignClass={fallbackCellAlignClass}
                />
                ))}

                {virtualizationActive && virtualRange.bottomPadding > 0 ? (
                  <TableRow aria-hidden="true">
                    <TableCell colSpan={colSpan} className="p-0" style={{ height: `${virtualRange.bottomPadding}px` }} />
                  </TableRow>
                ) : null}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {shouldRenderPagination ? (
        <div className={cn("flex w-full", paginationAlignClass)}>
          <Pagination {...paginationProps} />
        </div>
      ) : null}

      {toolbarPosition === "bottom" && renderedToolbar ? <div className="px-1">{renderedToolbar}</div> : null}
    </div>
  );
}
