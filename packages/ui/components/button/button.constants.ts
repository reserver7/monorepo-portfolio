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
    "border border-primary/25 bg-primary/8 text-primary shadow-none hover:border-primary/35 hover:bg-primary/12 active:bg-primary/16 focus-visible:ring-primary/25",
  outline:
    "border border-default bg-surface text-foreground shadow-sm hover:bg-surface-elevated active:bg-surface focus-visible:ring-primary/20",
  text: "bg-transparent text-primary shadow-none hover:bg-primary/10 active:bg-primary/15 focus-visible:ring-primary/20",
  link: "bg-transparent text-primary underline-offset-4 shadow-none hover:underline active:opacity-80 focus-visible:ring-primary/20"
};

export const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-caption",
  md: "h-10 px-4 py-2 text-body-sm",
  lg: "h-11 px-6 text-body-md"
};

export const BUTTON_SHAPE_CLASS: Record<ButtonShape, string> = {
  default: "rounded-md",
  rounded: "rounded-xl",
  pill: "rounded-full",
  square: "rounded-none"
};

export const BUTTON_ICON_ONLY_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-9 w-9 p-0",
  md: "h-10 w-10 p-0",
  lg: "h-11 w-11 p-0"
};
