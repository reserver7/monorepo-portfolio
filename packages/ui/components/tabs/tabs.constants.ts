import type { TabsSize, TabsVariant } from "./tabs.types";

export const TABS_DEFAULTS = {
  size: "md",
  variant: "pill",
  fullWidth: false
} as const;

export const TABS_LIST_SIZE_CLASS: Record<TabsSize, string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-11"
};

export const TABS_TRIGGER_SIZE_CLASS: Record<TabsSize, string> = {
  sm: "px-2.5 py-1 text-caption",
  md: "px-3 py-1.5 text-body-sm",
  lg: "px-4 py-2 text-body-md"
};

export const TABS_LIST_VARIANT_CLASS: Record<TabsVariant, string> = {
  pill: "bg-surface-elevated rounded-md p-1",
  underline: "bg-transparent rounded-none border-b border-default p-0"
};

export const TABS_TRIGGER_VARIANT_CLASS: Record<TabsVariant, string> = {
  pill: "rounded-sm data-[state=active]:bg-surface data-[state=active]:text-foreground",
  underline: "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground"
};
