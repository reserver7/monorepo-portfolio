import type { ProgressSize } from "./progress.types";

export const PROGRESS_DEFAULTS = {
  size: "md",
  color: "primary",
  striped: false,
  showValue: false,
  indeterminate: false
} as const;

export const PROGRESS_SIZE_CLASS: Record<ProgressSize, string> = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3"
};

export const PROGRESS_COLOR_CLASS = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info"
} as const;
