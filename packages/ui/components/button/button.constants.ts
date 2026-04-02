import type { ButtonShape, ButtonSize, ButtonVariant } from "./button.types";

export const BUTTON_DEFAULTS = {
  variant: "primary",
  size: "md",
  shape: "default",
  fullWidth: false
} satisfies {
  variant: ButtonVariant;
  size: ButtonSize;
  shape: ButtonShape;
  fullWidth: boolean;
};

export const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary !text-primary-foreground shadow-sm hover:brightness-95 active:brightness-90 focus-visible:ring-primary/30",
  secondary:
    "border border-default bg-surface-elevated text-foreground shadow-sm hover:bg-surface active:bg-surface-elevated focus-visible:ring-primary/20",
  danger:
    "bg-danger !text-danger-foreground shadow-sm hover:brightness-95 active:brightness-90 focus-visible:ring-danger/30",
  ghost:
    "bg-transparent text-muted hover:bg-surface-elevated hover:text-foreground focus-visible:ring-primary/20",
  outline:
    "border border-default bg-surface text-foreground shadow-sm hover:bg-surface-elevated active:bg-surface focus-visible:ring-primary/20"
};

export const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-caption",
  md: "h-10 px-4 py-2 text-body-sm",
  lg: "h-11 px-6 text-body-md"
};

export const BUTTON_SHAPE_CLASS: Record<ButtonShape, string> = {
  default: "rounded-md",
  rounded: "rounded-xl",
  pill: "rounded-full"
};
