import type { CheckboxOrientation, CheckboxSize } from "./checkbox.types";

export const CHECKBOX_DEFAULTS = {
  size: "sm",
  indeterminate: false,
  orientation: "horizontal"
} satisfies {
  size: CheckboxSize;
  indeterminate: boolean;
  orientation: CheckboxOrientation;
};

export const CHECKBOX_SIZE_CLASS: Record<CheckboxSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5"
};

export const CHECKBOX_ICON_SIZE_CLASS: Record<CheckboxSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4"
};

export const CHECKBOX_BASE_CLASS =
  "border-default bg-surface text-primary ring-offset-surface transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-primary/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground peer shrink-0 rounded-[5px] border focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-default disabled:hover:bg-surface";
