import type { LabelSize } from "./label.types";

export const LABEL_DEFAULTS = {
  size: "md",
  color: "default",
  required: false
} as const;

export const LABEL_SIZE_CLASS: Record<LabelSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base"
};

export const LABEL_COLOR_CLASS = {
  default: "text-foreground",
  muted: "text-muted",
  danger: "text-danger"
} as const;
