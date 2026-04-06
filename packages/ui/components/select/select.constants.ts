import type { SelectTriggerSize, SelectTriggerState, SelectTriggerVariant } from "./select.types";

export const SELECT_DEFAULTS = {
  placeholder: "선택하세요",
  emptyMessage: "결과가 없습니다.",
  searchPlaceholder: "검색",
  size: "md",
  variant: "default",
  state: "default",
  searchable: false,
  multiple: false,
  loading: false,
  maxVisibleItems: 8,
  maxTagCount: 2
} satisfies {
  placeholder: string;
  emptyMessage: string;
  searchPlaceholder: string;
  size: SelectTriggerSize;
  variant: SelectTriggerVariant;
  state: SelectTriggerState;
  searchable: boolean;
  multiple: boolean;
  loading: boolean;
  maxVisibleItems: number;
  maxTagCount: number;
};

export const SELECT_ROW_HEIGHT_PX = 36;

export const SELECT_TRIGGER_BASE_CLASS =
  "inline-flex w-full items-center justify-between rounded-md border px-3 py-2 text-foreground outline-none transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50";

export const SELECT_CONTENT_BASE_CLASS =
  "z-50 max-h-80 min-w-[var(--radix-select-trigger-width)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-default bg-surface shadow-md";

export const SELECT_POPOVER_CONTENT_BASE_CLASS = "border-default bg-surface z-50 rounded-md border p-2 shadow-md";

export const SELECT_SCROLL_LIST_CLASS = "space-y-1 overflow-auto p-1";

export const SELECT_SIZE_CLASS: Record<SelectTriggerSize, string> = {
  sm: "h-9 text-body-sm",
  md: "h-10 text-body-md",
  lg: "h-11 text-body-md"
};

export const SELECT_VARIANT_CLASS: Record<SelectTriggerVariant, string> = {
  default: "border-default bg-surface shadow-sm hover:border-primary/30",
  filled: "border-transparent bg-surface-elevated hover:border-default",
  ghost: "border-primary/25 bg-primary/6 shadow-none hover:border-primary/35 hover:bg-primary/10"
};

export const SELECT_STATE_CLASS: Record<SelectTriggerState, string> = {
  default: "focus:border-primary focus:ring-primary/20",
  error: "border-danger/40 focus:border-danger focus:ring-danger/20",
  success: "border-success/40 focus:border-success focus:ring-success/20"
};
