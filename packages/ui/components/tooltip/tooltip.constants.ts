import type { TooltipAlignment, TooltipPlacement, TooltipSize } from "./tooltip.types";

export const TOOLTIP_DEFAULTS = {
  placement: "top" as TooltipPlacement,
  alignment: "center" as TooltipAlignment,
  offset: 6,
  size: "md",
  color: "inverse",
  withArrow: false
} as const;

export const TOOLTIP_SIZE_CLASS: Record<TooltipSize, string> = {
  sm: "px-[var(--space-2)] py-[var(--space-1)] text-[11px]",
  md: "px-[var(--space-3)] py-[var(--space-1-5)] text-xs",
  lg: "px-[var(--space-3-5)] py-[var(--space-2)] text-body-sm"
};

export const TOOLTIP_COLOR_CLASS = {
  default: "bg-surface-elevated text-foreground border border-default",
  inverse: "bg-foreground text-surface",
  primary: "bg-primary text-primary-foreground"
} as const;

export const TOOLTIP_ARROW_CLASS = {
  default: "fill-surface-elevated",
  inverse: "fill-foreground",
  primary: "fill-primary"
} as const;
