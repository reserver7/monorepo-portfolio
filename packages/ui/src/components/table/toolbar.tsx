import * as React from "react";
import { cn } from "../../lib/utils";
export type TableToolbarProps = React.HTMLAttributes<HTMLDivElement>;
function TableToolbar({ className, ...props }: TableToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2 py-2", className)} {...props} />
  );
}
function TableToolbarActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2", className)} {...props} />;
}
export { TableToolbar, TableToolbarActions };
