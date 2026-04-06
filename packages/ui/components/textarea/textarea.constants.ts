import type { TextareaResize, TextareaSize, TextareaState, TextareaVariant } from "./textarea.types";

export const TEXTAREA_DEFAULTS = {
  size: "md",
  variant: "default",
  status: "default",
  resize: "vertical",
  showCount: false,
  rows: 4
} satisfies {
  size: TextareaSize;
  variant: TextareaVariant;
  status: TextareaState;
  resize: TextareaResize;
  showCount: boolean;
  rows: number;
};

export const TEXTAREA_SIZE_CLASS: Record<TextareaSize, string> = {
  sm: "min-h-[84px] text-body-sm",
  md: "min-h-[110px] text-body-md",
  lg: "min-h-[140px] text-body-md"
};

export const TEXTAREA_VARIANT_CLASS: Record<TextareaVariant, string> = {
  default: "border-default bg-surface shadow-sm hover:border-primary/30",
  filled: "border-transparent bg-surface-elevated hover:border-default",
  ghost: "border-primary/25 bg-primary/6 shadow-none hover:border-primary/35 hover:bg-primary/10"
};

export const TEXTAREA_STATUS_CLASS: Record<TextareaState, string> = {
  default: "focus:border-primary focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-surface",
  error: "border-danger/40 focus:border-danger focus:ring-danger/20",
  success: "border-success/40 focus:border-success focus:ring-success/20"
};

export const TEXTAREA_RESIZE_CLASS: Record<TextareaResize, string> = {
  none: "resize-none",
  vertical: "resize-y",
  horizontal: "resize-x",
  both: "resize"
};
