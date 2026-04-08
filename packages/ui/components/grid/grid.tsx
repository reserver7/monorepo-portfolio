"use client";

import * as React from "react";
import { GRID_DEFAULTS } from "./grid.constants";
import { getGridClassName, getGridStyle } from "./grid.utils";
import type { GridProps } from "./grid.types";

const GridBase = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      className,
      style,
      columns = GRID_DEFAULTS.columns,
      gap = GRID_DEFAULTS.gap,
      rowGap = GRID_DEFAULTS.rowGap,
      columnGap = GRID_DEFAULTS.columnGap,
      align = GRID_DEFAULTS.align,
      justify = GRID_DEFAULTS.justify,
      autoFit = GRID_DEFAULTS.autoFit,
      minColumnWidth = GRID_DEFAULTS.minColumnWidth,
      dense = GRID_DEFAULTS.dense,
      fullWidth = GRID_DEFAULTS.fullWidth,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={getGridClassName({ columns, gap, rowGap, columnGap, align, justify, autoFit, dense, fullWidth, className })}
      style={getGridStyle({ autoFit, minColumnWidth, style })}
      {...props}
    />
  )
);

GridBase.displayName = "GridBase";

export const Grid = React.memo(GridBase);
Grid.displayName = "Grid";

