"use client";
import * as React from "react";
import {
  type ColumnDef,
  type RowData,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { cn } from "../../lib/utils";
import { EmptyState } from "../feedback/empty-state";
import { ErrorState } from "../feedback/error-state";
import { LoadingState } from "../feedback/loading-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { TablePagination } from "./pagination";
export type DataTableColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<TData, TValue>;
export interface DataTableProps<TData extends RowData, TValue = unknown> {
  columns: Array<DataTableColumnDef<TData, TValue>>;
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  loadingMessage?: React.ReactNode;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  emptyAction?: React.ReactNode;
  errorTitle?: React.ReactNode;
  errorDescription?: React.ReactNode;
  errorAction?: React.ReactNode;
  enableSorting?: boolean;
  tableClassName?: string;
  className?: string;
  getRowId?: (originalRow: TData, index: number) => string;
  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (nextPage: number) => void;
}
function DataTable<TData extends RowData, TValue = unknown>({
  columns,
  data,
  isLoading = false,
  isError = false,
  loadingMessage = "데이터를 불러오는 중...",
  emptyTitle = "데이터가 없습니다.",
  emptyDescription,
  emptyAction,
  errorTitle = "데이터를 불러오지 못했습니다.",
  errorDescription = "잠시 후 다시 시도해 주세요.",
  errorAction,
  enableSorting = true,
  tableClassName,
  className,
  getRowId,
  page,
  totalPages,
  totalCount,
  onPageChange
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const columnCount = React.useMemo(() => Math.max(columns.length, 1), [columns.length]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getRowId
  });
  const rows = table.getRowModel().rows;
  return (
    <section
      className={cn("border-default bg-surface overflow-hidden rounded-2xl border shadow-sm", className)}
    >
      <Table className={cn("min-w-[720px]", tableClassName)}>
        <TableHeader className="bg-surface-elevated">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isError ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="p-4">
                <ErrorState title={errorTitle} description={errorDescription} action={errorAction} />
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="p-4">
                <LoadingState message={loadingMessage} />
              </TableCell>
            </TableRow>
          ) : rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columnCount} className="p-4">
                <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {typeof page === "number" && typeof totalPages === "number" && onPageChange ? (
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={onPageChange}
        />
      ) : null}
    </section>
  );
}
export { DataTable };
