import type { RadioGroupOrientation, RadioGroupSize } from "./radio-group.types";

export const RADIO_GROUP_DEFAULTS = {
  size: "sm",
  orientation: "vertical"
} satisfies {
  size: RadioGroupSize;
  orientation: RadioGroupOrientation;
};

export const RADIO_GROUP_SIZE_CLASS: Record<RadioGroupSize, string> = {
  sm: "h-[var(--size-icon-md)] w-[var(--size-icon-md)]",
  md: "h-[var(--size-icon-lg)] w-[var(--size-icon-lg)]"
};

export const RADIO_GROUP_INDICATOR_SIZE_CLASS: Record<RadioGroupSize, string> = {
  sm: "h-[var(--space-2-5)] w-[var(--space-2-5)]",
  md: "h-[var(--space-3)] w-[var(--space-3)]"
};

export const RADIO_GROUP_ITEM_BASE_CLASS =
  "border-default bg-surface text-primary ring-offset-surface transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-primary/30 data-[state=checked]:border-primary data-[state=checked]:text-primary data-[state=checked]:hover:border-primary data-[state=checked]:hover:bg-primary/10 aspect-square rounded-full border shadow-none focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-default disabled:hover:bg-surface";
