import type { SpinnerSize } from "./spinner.types";

export const SPINNER_DEFAULTS = {
  open: true,
  fullscreen: false,
  size: "md",
  color: "default"
} as const;

export const SPINNER_SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: "h-[var(--size-icon-md)] w-[var(--size-icon-md)]",
  md: "h-[var(--size-control-sm)] w-[var(--size-control-sm)]",
  lg: "h-[var(--size-control-lg)] w-[var(--size-control-lg)]"
};

export const SPINNER_COLOR_CLASS = {
  default: "text-muted",
  primary: "text-primary",
  danger: "text-danger",
  success: "text-success",
  warning: "text-warning"
} as const;
