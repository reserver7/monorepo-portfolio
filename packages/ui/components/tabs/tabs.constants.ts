import type { TabsSize, TabsVariant } from "./tabs.types";

export const TABS_DEFAULTS = {
  size: "md",
  variant: "pill",
  fullWidth: false
} as const;

export const TABS_LIST_SIZE_CLASS: Record<TabsSize, string> = {
  sm: "h-[var(--size-control-sm)]",
  md: "h-[var(--size-control-lg)]",
  lg: "h-[var(--size-control-xl)]"
};

export const TABS_TRIGGER_SIZE_CLASS: Record<TabsSize, string> = {
  sm: "px-[var(--space-2-5)] py-[var(--space-1)] text-caption",
  md: "px-[var(--space-3)] py-[var(--space-1-5)] text-body-sm",
  lg: "px-[var(--space-4)] py-[var(--space-2)] text-body-md"
};

export const TABS_LIST_VARIANT_CLASS: Record<TabsVariant, string> = {
  pill: "bg-surface-elevated border border-default rounded-[var(--radius-md)] p-[var(--space-1)]",
  underline: "bg-transparent rounded-none border-b border-default p-0"
};

export const TABS_TRIGGER_VARIANT_CLASS: Record<TabsVariant, string> = {
  pill:
    "text-muted rounded-[var(--radius-sm)] hover:bg-surface hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none",
  underline:
    "text-muted rounded-none border-b-2 border-transparent hover:border-default hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold"
};
