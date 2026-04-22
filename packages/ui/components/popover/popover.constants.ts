import type { PopoverSize, PopoverVariant } from "./popover.types";

export const POPOVER_DEFAULTS = {
  size: "md",
  variant: "default",
  sideOffset: 6,
  align: "center",
  withArrow: false
} as const;

export const POPOVER_SIZE_CLASS: Record<PopoverSize, string> = {
  sm: "w-[var(--size-popover-sm)]",
  md: "w-[var(--size-popover-md)]",
  lg: "w-[var(--size-popover-lg)]"
};

export const POPOVER_VARIANT_CLASS: Record<PopoverVariant, string> = {
  default: "border-default bg-surface",
  elevated: "border-default bg-surface-elevated"
};
