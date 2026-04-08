import type { TableDensity } from "./table.types";

export const TABLE_DEFAULTS = {
  stickyHeader: false,
  density: "default",
  striped: false,
  hoverable: true
} as const;

export const TABLE_DENSITY_CLASS: Record<TableDensity, string> = {
  compact: "[&_td]:py-1 [&_th]:py-1",
  default: "",
  comfortable: "[&_td]:py-3.5 [&_th]:py-3.5"
};
