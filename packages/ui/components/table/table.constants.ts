import type { TableDensity } from "./table.types";

export const TABLE_DEFAULTS = {
  stickyHeader: false,
  density: "default",
  striped: false,
  hoverable: true
} as const;

export const TABLE_DENSITY_CLASS: Record<TableDensity, string> = {
  compact: "[&_td]:py-[var(--space-1)] [&_th]:py-[var(--space-1)]",
  default: "",
  comfortable: "[&_td]:py-[var(--space-3-5)] [&_th]:py-[var(--space-3-5)]"
};
