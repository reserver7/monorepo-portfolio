import type { SpinnerSize } from "./spinner.types";

export const SPINNER_DEFAULTS = {
  open: true,
  fullscreen: false,
  size: "md",
  color: "default"
} as const;

export const SPINNER_SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8"
};

export const SPINNER_COLOR_CLASS = {
  default: "text-muted",
  primary: "text-primary",
  danger: "text-danger",
  success: "text-success",
  warning: "text-warning"
} as const;
