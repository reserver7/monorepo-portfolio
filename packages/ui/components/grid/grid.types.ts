import type * as React from "react";

export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
export type GridAlign = "start" | "center" | "end" | "stretch";
export type GridJustify = "start" | "center" | "end" | "between";
export type GridGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export type GridMinColumnWidth = "xs" | "sm" | "md" | "lg" | "xl";

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: GridColumns;
  gap?: GridGap;
  rowGap?: GridGap;
  columnGap?: GridGap;
  align?: GridAlign;
  justify?: GridJustify;
  autoFit?: boolean;
  minColumnWidth?: GridMinColumnWidth;
  dense?: boolean;
  fullWidth?: boolean;
}

