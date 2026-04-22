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
  sm: "h-[var(--size-control-md)] px-[var(--space-3)] text-caption",
  md: "h-[var(--size-control-lg)] px-[var(--space-4)] py-[var(--space-2)] text-body-sm",
  lg: "h-[var(--size-control-xl)] px-[var(--space-6)] text-body-md"
};

export const BUTTON_SHAPE_CLASS: Record<ButtonShape, string> = {
  default: "rounded-[var(--radius-md)]",
  rounded: "rounded-[var(--radius-xl)]",
  pill: "rounded-[var(--radius-pill)]",
  square: "rounded-none"
};

export const BUTTON_ICON_ONLY_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-[var(--size-control-md)] w-[var(--size-control-md)] shrink-0 p-0",
  md: "h-[var(--size-control-lg)] w-[var(--size-control-lg)] shrink-0 p-0",
  lg: "h-[var(--size-control-xl)] w-[var(--size-control-xl)] shrink-0 p-0"
};
