import type { SelectTriggerSize, SelectTriggerStatus, SelectTriggerVariant } from "./select.types";

export const SELECT_DEFAULTS = {
  placeholder: "선택하세요",
  emptyMessage: "결과가 없습니다.",
  searchPlaceholder: "검색",
  size: "md",
  variant: "default",
  status: "default",
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
  status: SelectTriggerStatus;
  searchable: boolean;
  multiple: boolean;
  loading: boolean;
  maxVisibleItems: number;
  maxTagCount: number;
};

export const SELECT_ROW_HEIGHT_PX = 36;

export const SELECT_TRIGGER_BASE_CLASS =
  "inline-flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-md)] border px-[var(--space-3)] py-[var(--space-2)] text-foreground outline-none transition-colors focus:ring-1 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50";

export const SELECT_CONTENT_BASE_CLASS =
  "z-50 max-h-[var(--size-select-content-max-h)] min-w-[var(--radix-select-trigger-width)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-md)] border border-default bg-surface shadow-[var(--shadow-card)]";

export const SELECT_POPOVER_CONTENT_BASE_CLASS =
  "border-default bg-surface z-50 rounded-[var(--radius-md)] border p-[var(--space-2)] shadow-[var(--shadow-card)]";

export const SELECT_SCROLL_LIST_CLASS = "space-y-[var(--space-1)] overflow-auto p-[var(--space-1)]";

export const SELECT_SIZE_CLASS: Record<SelectTriggerSize, string> = {
  sm: "h-[var(--size-control-md)] text-body-sm",
  md: "h-[var(--size-control-xl)] text-body-md",
  lg: "h-[var(--size-control-2xl)] text-body-md"
};

export const SELECT_VARIANT_CLASS: Record<SelectTriggerVariant, string> = {
  default: "border-default bg-surface shadow-none hover:border-primary/35",
  filled: "border border-transparent bg-surface-elevated shadow-none hover:bg-[rgb(var(--color-bg-surface))]",
  ghost: "border border-transparent bg-transparent shadow-none hover:bg-surface-elevated/70 focus:bg-surface-elevated/80"
};

export const SELECT_STATUS_CLASS: Record<SelectTriggerStatus, string> = {
  default: "focus:border-primary focus:ring-primary/30",
  error: "border-danger/40 focus:border-danger focus:ring-danger/25",
  success: "border-success/40 focus:border-success focus:ring-success/25"
};
