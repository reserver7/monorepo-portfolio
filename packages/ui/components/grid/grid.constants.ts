import type { GridAlign, GridColumns, GridGap, GridJustify, GridMinColumnWidth } from "./grid.types";

export const GRID_DEFAULTS = {
  columns: 1 as GridColumns,
  gap: "none" as GridGap,
  rowGap: "none" as GridGap,
  columnGap: "none" as GridGap,
  align: "stretch" as GridAlign,
  justify: "between" as GridJustify,
  autoFit: false,
  minColumnWidth: "md" as GridMinColumnWidth,
  dense: false,
  fullWidth: false
};

export const GRID_COLUMNS_CLASS: Record<GridColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  8: "grid-cols-8",
  10: "grid-cols-10",
  12: "grid-cols-12"
};

export const GRID_ALIGN_CLASS: Record<GridAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch"
};

export const GRID_JUSTIFY_CLASS: Record<GridJustify, string> = {
  start: "justify-items-start",
  center: "justify-items-center",
  end: "justify-items-end",
  between: "justify-items-stretch"
};

export const GRID_GAP_CLASS: Record<GridGap, string> = {
  none: "",
  xs: "gap-[var(--space-1)]",
  sm: "gap-[var(--space-2)]",
  md: "gap-[var(--space-3)]",
  lg: "gap-[var(--space-4)]",
  xl: "gap-[var(--space-6)]"
};

export const GRID_ROW_GAP_CLASS: Record<GridGap, string> = {
  none: "",
  xs: "gap-y-[var(--space-1)]",
  sm: "gap-y-[var(--space-2)]",
  md: "gap-y-[var(--space-3)]",
  lg: "gap-y-[var(--space-4)]",
  xl: "gap-y-[var(--space-6)]"
};

export const GRID_COLUMN_GAP_CLASS: Record<GridGap, string> = {
  none: "",
  xs: "gap-x-[var(--space-1)]",
  sm: "gap-x-[var(--space-2)]",
  md: "gap-x-[var(--space-3)]",
  lg: "gap-x-[var(--space-4)]",
  xl: "gap-x-[var(--space-6)]"
};

export const GRID_MIN_COLUMN_WIDTH_VALUE: Record<GridMinColumnWidth, string> = {
  xs: "160px",
  sm: "200px",
  md: "240px",
  lg: "280px",
  xl: "320px"
};
