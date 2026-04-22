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
  sm: {
    root: "h-[var(--size-switch-sm-track-h)] w-[var(--size-switch-sm-track-w)]",
    thumb: "h-[var(--size-switch-sm-thumb)] w-[var(--size-switch-sm-thumb)]",
    checked: "data-[state=checked]:translate-x-[var(--size-switch-sm-translate)]"
  },
  md: {
    root: "h-[var(--size-switch-md-track-h)] w-[var(--size-switch-md-track-w)]",
    thumb: "h-[var(--size-switch-md-thumb)] w-[var(--size-switch-md-thumb)]",
    checked: "data-[state=checked]:translate-x-[var(--size-switch-md-translate)]"
  }
};

export const SWITCH_COLOR_CLASS = {
  primary: "focus-visible:ring-primary/30 data-[state=checked]:bg-primary",
  success: "focus-visible:ring-success/30 data-[state=checked]:bg-success",
  warning: "focus-visible:ring-warning/30 data-[state=checked]:bg-warning",
  danger: "focus-visible:ring-danger/30 data-[state=checked]:bg-danger"
} as const;
