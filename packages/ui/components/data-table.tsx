"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./cn";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { StateView } from "./state-view";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type DataTableColumnDef<T> = {
  id?: string;
  accessorKey?: keyof T | string;
  header?: React.ReactNode | ((ctx: { column: { id: string } }) => React.ReactNode);
  cell?: (ctx: { row: { original: T }; getValue: () => unknown }) => React.ReactNode;
};

export interface DataTableProps<T> {
  columns: Array<DataTableColumnDef<T>>;
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  errorTitle?: string;
  tableClassName?: string;
  tableDensity?: "compact" | "default" | "comfortable";
  stickyHeader?: boolean;
  striped?: boolean;
  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  getRowId?: (row: T, index: number) => string;
}

export function DataTableColumnHeader({ title }: { column?: { id: string }; title: string }) {
  return <span className="text-muted text-xs font-semibold">{title}</span>;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  loadingMessage = "데이터를 불러오는 중...",
  emptyTitle = "데이터가 없습니다.",
  errorTitle = "조회에 실패했습니다.",
  tableClassName,
  tableDensity = "default",
  stickyHeader = false,
  striped = false,
  page = 1,
  totalPages = 1,
  totalCount,
  onPageChange,
  getRowId
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="border-default bg-surface space-y-3 rounded-xl border p-4">
        <div className="grid gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <p className="text-muted text-xs">{loadingMessage}</p>
      </div>
    );
  }

  if (isError) {
    return <StateView variant="error" size="sm" title={errorTitle} />;
  }

  if (data.length === 0) {
    return <StateView variant="empty" size="sm" title={emptyTitle} />;
  }

  return (
    <div className="space-y-3">
      <div className="border-default bg-surface overflow-x-auto rounded-xl border">
        <Table
          className={cn("min-w-full text-sm", tableClassName)}
          density={tableDensity}
          stickyHeader={stickyHeader}
          containerClassName="max-h-[70vh]"
        >
          <TableHeader className="bg-surface-elevated/70">
            <TableRow>
              {columns.map((column, index) => {
                const id = column.id ?? String(column.accessorKey ?? index);
                return (
                  <TableHead key={id} className="px-3 text-left">
                    {typeof column.header === "function" ? column.header({ column: { id } }) : column.header}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => {
              const key = getRowId ? getRowId(row, rowIndex) : String(rowIndex);
              return (
                <TableRow
                  key={key}
                  className={cn(
                    "last:border-none",
                    striped && rowIndex % 2 === 1 && "bg-surface-elevated/30"
                  )}
                >
                  {columns.map((column, colIndex) => {
                    const id = column.id ?? String(column.accessorKey ?? colIndex);
                    const rawValue = column.accessorKey
                      ? (row as Record<string, unknown>)[String(column.accessorKey)]
                      : undefined;
                    const rendered = column.cell
                      ? column.cell({ row: { original: row }, getValue: () => rawValue })
                      : (rawValue as React.ReactNode);
                    return (
                      <TableCell key={`${key}-${id}`} className="text-foreground px-3 align-top">
                        {rendered ?? "-"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {onPageChange ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted text-xs">
            페이지 {page} / {totalPages}
            {typeof totalCount === "number" ? ` · 총 ${totalCount}건` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
