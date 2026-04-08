import type { TooltipAlignment, TooltipColor, TooltipPlacement, TooltipSize } from "./tooltip.types";

export const TOOLTIP_DEFAULTS = {
  placement: "top" as TooltipPlacement,
  alignment: "center" as TooltipAlignment,
  offset: 6,
  size: "md",
  color: "inverse",
  withArrow: false
} as const;

export const TOOLTIP_SIZE_CLASS: Record<TooltipSize, string> = {
  sm: "px-2 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs",
  lg: "px-3.5 py-2 text-body-sm"
};

export const TOOLTIP_COLOR_CLASS: Record<TooltipColor, string> = {
  default: "bg-surface-elevated text-foreground border border-default",
  inverse: "bg-foreground text-surface",
  primary: "bg-primary text-primary-foreground"
};

export const TOOLTIP_ARROW_CLASS: Record<TooltipColor, string> = {
  default: "fill-surface-elevated",
  inverse: "fill-foreground",
  primary: "fill-primary"
};
