import type { TextareaResize, TextareaSize, TextareaStatus, TextareaVariant } from "./textarea.types";

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
  status: TextareaStatus;
  resize: TextareaResize;
  showCount: boolean;
  rows: number;
};

export const TEXTAREA_SIZE_CLASS: Record<TextareaSize, string> = {
  sm: "min-h-[84px] text-body-sm",
  md: "min-h-[120px] text-body-md",
  lg: "min-h-[150px] text-body-md"
};

export const TEXTAREA_VARIANT_CLASS: Record<TextareaVariant, string> = {
  default: "border-default bg-surface shadow-none hover:border-primary/35",
  filled: "border border-transparent bg-surface-elevated shadow-none hover:bg-[rgb(var(--color-bg-surface))]",
  ghost: "border border-transparent bg-transparent shadow-none hover:bg-surface-elevated/70 focus:bg-surface-elevated/80"
};

export const TEXTAREA_STATUS_CLASS: Record<TextareaStatus, string> = {
  default: "focus:border-primary focus:ring-1 focus:ring-primary/30 focus:ring-offset-0",
  error: "border-danger/40 focus:border-danger focus:ring-1 focus:ring-danger/25 focus:ring-offset-0",
  success: "border-success/40 focus:border-success focus:ring-1 focus:ring-success/25 focus:ring-offset-0"
};

export const TEXTAREA_RESIZE_CLASS: Record<TextareaResize, string> = {
  none: "resize-none",
  vertical: "resize-y",
  horizontal: "resize-x",
  both: "resize"
};
