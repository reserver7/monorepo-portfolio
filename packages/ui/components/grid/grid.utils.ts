import type * as React from "react";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import {
  GRID_ALIGN_CLASS,
  GRID_COLUMN_GAP_CLASS,
  GRID_COLUMNS_CLASS,
  GRID_DEFAULTS,
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
  const resolvedColumns = resolveOption(columns, GRID_COLUMNS_CLASS, GRID_DEFAULTS.columns);
  const resolvedAlign = resolveOption(align, GRID_ALIGN_CLASS, GRID_DEFAULTS.align);
  const resolvedJustify = resolveOption(justify, GRID_JUSTIFY_CLASS, GRID_DEFAULTS.justify);
  const resolvedGap = resolveOption(gap, GRID_GAP_CLASS, GRID_DEFAULTS.gap);
  const resolvedRowGap = resolveOption(rowGap, GRID_ROW_GAP_CLASS, GRID_DEFAULTS.rowGap);
  const resolvedColumnGap = resolveOption(columnGap, GRID_COLUMN_GAP_CLASS, GRID_DEFAULTS.columnGap);

  return cn(
    "grid",
    autoFit ? "[grid-template-columns:repeat(auto-fit,minmax(var(--grid-min-column-width),1fr))]" : GRID_COLUMNS_CLASS[resolvedColumns],
    GRID_ALIGN_CLASS[resolvedAlign],
    GRID_JUSTIFY_CLASS[resolvedJustify],
    GRID_GAP_CLASS[resolvedGap],
    GRID_ROW_GAP_CLASS[resolvedRowGap],
    GRID_COLUMN_GAP_CLASS[resolvedColumnGap],
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
  const resolvedMinColumnWidth = resolveOption(minColumnWidth, GRID_MIN_COLUMN_WIDTH_VALUE, GRID_DEFAULTS.minColumnWidth);
  return {
    ...(style ?? {}),
    "--grid-min-column-width": GRID_MIN_COLUMN_WIDTH_VALUE[resolvedMinColumnWidth]
  } as React.CSSProperties;
};
