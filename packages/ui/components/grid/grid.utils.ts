import type * as React from "react";
import { cn } from "../cn";
import {
  GRID_ALIGN_CLASS,
  GRID_COLUMN_GAP_CLASS,
  GRID_COLUMNS_CLASS,
  GRID_GAP_CLASS,
  GRID_JUSTIFY_CLASS,
  GRID_MIN_COLUMN_WIDTH_VALUE,
  GRID_ROW_GAP_CLASS
} from "./grid.constants";
import type { GridAlign, GridColumns, GridGap, GridJustify, GridMinColumnWidth } from "./grid.types";

export const getGridClassName = (params: {
  columns: GridColumns;
  gap: GridGap;
  rowGap: GridGap;
  columnGap: GridGap;
  align: GridAlign;
  justify: GridJustify;
  autoFit: boolean;
  dense: boolean;
  fullWidth: boolean;
  className?: string;
}) => {
  const { columns, gap, rowGap, columnGap, align, justify, autoFit, dense, fullWidth, className } = params;

  return cn(
    "grid",
    autoFit ? "[grid-template-columns:repeat(auto-fit,minmax(var(--grid-min-column-width),1fr))]" : GRID_COLUMNS_CLASS[columns],
    GRID_ALIGN_CLASS[align],
    GRID_JUSTIFY_CLASS[justify],
    GRID_GAP_CLASS[gap],
    GRID_ROW_GAP_CLASS[rowGap],
    GRID_COLUMN_GAP_CLASS[columnGap],
    dense ? "grid-flow-row-dense" : null,
    fullWidth ? "w-full" : null,
    className
  );
};

export const getGridStyle = (params: {
  autoFit: boolean;
  minColumnWidth: GridMinColumnWidth;
  style?: React.CSSProperties;
}) => {
  const { autoFit, minColumnWidth, style } = params;
  if (!autoFit) return style;
  return {
    ...(style ?? {}),
    "--grid-min-column-width": GRID_MIN_COLUMN_WIDTH_VALUE[minColumnWidth]
  } as React.CSSProperties;
};

