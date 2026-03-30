import * as React from "react";
import { cn } from "./cn";

type TableDensity = "compact" | "default" | "comfortable";

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
  stickyHeader?: boolean;
  density?: TableDensity;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, containerClassName, stickyHeader = false, density = "default", ...props }, ref) => (
  <div className={cn("relative w-full overflow-auto", containerClassName)}>
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm",
        stickyHeader && "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[1]",
        density === "compact" && "[&_th]:py-1 [&_td]:py-1",
        density === "comfortable" && "[&_th]:py-3.5 [&_td]:py-3.5",
        className
      )}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("border-b border-default", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn("border-t border-default bg-surface-elevated font-medium", className)} {...props} />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b border-default transition-colors hover:bg-surface-elevated/40", className)} {...props} />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("h-10 px-2 text-left align-middle font-medium text-muted", className)} {...props} />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-2 align-middle", className)} {...props} />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-muted", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
