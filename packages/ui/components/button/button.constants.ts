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
    "bg-primary !text-primary-foreground shadow-none hover:bg-[rgb(var(--color-accent-primary-hover))] active:bg-[rgb(var(--color-accent-primary-active))] focus-visible:ring-primary/35",
  secondary:
    "border border-default bg-surface-elevated text-foreground shadow-none hover:bg-surface active:bg-surface-elevated focus-visible:ring-primary/25",
  danger:
    "bg-danger !text-danger-foreground shadow-none hover:bg-[rgb(var(--color-feedback-danger-hover))] active:bg-[rgb(var(--color-feedback-danger-active))] focus-visible:ring-danger/35",
  ghost:
    "border border-transparent bg-primary/10 text-primary shadow-none hover:bg-primary/15 active:bg-primary/20 focus-visible:ring-primary/25",
  outline:
    "border-2 border-primary/50 bg-transparent text-primary shadow-none hover:bg-primary/10 active:bg-primary/15 focus-visible:ring-primary/25",
  text: "border border-transparent bg-transparent text-primary shadow-none hover:underline active:opacity-80 focus-visible:ring-primary/25",
  link: "bg-transparent text-link underline-offset-4 shadow-none hover:underline active:opacity-80 focus-visible:ring-primary/25"
};

export const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-caption",
  md: "h-10 px-4 py-2 text-body-sm",
  lg: "h-11 px-6 text-body-md"
};

export const BUTTON_SHAPE_CLASS: Record<ButtonShape, string> = {
  default: "rounded-[var(--radius-md)]",
  rounded: "rounded-[var(--radius-xl)]",
  pill: "rounded-[var(--radius-pill)]",
  square: "rounded-none"
};

export const BUTTON_ICON_ONLY_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-9 w-9 shrink-0 p-0",
  md: "h-10 w-10 shrink-0 p-0",
  lg: "h-11 w-11 shrink-0 p-0"
};
