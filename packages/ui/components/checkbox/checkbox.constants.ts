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
  sm: "h-[var(--size-icon-md)] w-[var(--size-icon-md)]",
  md: "h-[var(--size-icon-lg)] w-[var(--size-icon-lg)]"
};

export const CHECKBOX_ICON_SIZE_CLASS: Record<CheckboxSize, string> = {
  sm: "h-[var(--size-icon-sm)] w-[var(--size-icon-sm)]",
  md: "h-[var(--size-icon-md)] w-[var(--size-icon-md)]"
};

export const CHECKBOX_BASE_CLASS =
  "border-default bg-surface text-primary ring-offset-surface transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-primary/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:hover:border-primary data-[state=checked]:hover:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:hover:border-primary data-[state=indeterminate]:hover:bg-primary peer shrink-0 rounded-[var(--radius-sm)] border focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-default disabled:hover:bg-surface";
