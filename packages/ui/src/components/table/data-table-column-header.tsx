"use client";
import type { Column } from "@tanstack/react-table";
import { cn } from "../../lib/utils";
import { Button } from "../form/button";
type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
};
function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sortedState = column.getIsSorted();
  const indicator = sortedState === "asc" ? "↑" : sortedState === "desc" ? "↓" : "↕";
  if (!column.getCanSort()) {
    return <span className={cn("text-xs font-semibold uppercase tracking-wide", className)}>{title}</span>;
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("text-muted h-8 px-1 font-semibold uppercase tracking-wide", className)}
      onClick={() => column.toggleSorting(sortedState === "asc")}
    >
      <span>{title}</span> <span className="text-muted-foreground ml-1.5 text-xs"> {indicator} </span>
    </Button>
  );
}
export { DataTableColumnHeader };
