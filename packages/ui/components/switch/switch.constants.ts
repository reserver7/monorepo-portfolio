import type { SwitchSize } from "./switch.types";

export const SWITCH_DEFAULTS = {
  size: "sm",
  color: "primary",
  loading: false
} satisfies {
  size: SwitchSize;
  color: "primary";
  loading: boolean;
};

export const SWITCH_SIZE_CLASS: Record<SwitchSize, { root: string; thumb: string; checked: string }> = {
  sm: { root: "h-5 w-9", thumb: "h-4 w-4", checked: "data-[state=checked]:translate-x-4" },
  md: { root: "h-6 w-11", thumb: "h-5 w-5", checked: "data-[state=checked]:translate-x-5" }
};

export const SWITCH_COLOR_CLASS = {
  primary: "focus-visible:ring-primary/30 data-[state=checked]:bg-primary",
  success: "focus-visible:ring-success/30 data-[state=checked]:bg-success",
  warning: "focus-visible:ring-warning/30 data-[state=checked]:bg-warning",
  danger: "focus-visible:ring-danger/30 data-[state=checked]:bg-danger"
} as const;
