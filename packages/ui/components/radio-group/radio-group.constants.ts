import type { RadioGroupSize } from "./radio-group.types";

export const RADIO_GROUP_DEFAULTS = {
  size: "sm"
} satisfies {
  size: RadioGroupSize;
};

export const RADIO_GROUP_SIZE_CLASS: Record<RadioGroupSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5"
};

export const RADIO_GROUP_INDICATOR_SIZE_CLASS: Record<RadioGroupSize, string> = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3"
};

export const RADIO_GROUP_ITEM_BASE_CLASS =
  "border-default bg-surface text-primary ring-offset-surface transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-primary/30 data-[state=checked]:border-primary data-[state=checked]:text-primary aspect-square rounded-full border shadow-none focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-default disabled:hover:bg-surface";
