import type { BadgeShape, BadgeSize, BadgeVariant } from "./badge.types";

export const BADGE_DEFAULTS = {
  variant: "default" as BadgeVariant,
  size: "sm" as BadgeSize,
  shape: "pill" as BadgeShape,
  dot: false,
  pulse: false,
  interactive: false,
  truncate: false,
  removable: false,
  removeLabel: "제거"
};

export const BADGE_VARIANT_CLASS: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  secondary: "bg-surface-elevated text-foreground",
  outline: "border border-default bg-transparent text-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  dangerSolid: "border border-danger bg-danger !text-danger-foreground",
  destructive: "bg-danger/15 text-danger",
  info: "bg-info/15 text-info"
};

export const BADGE_SIZE_CLASS: Record<BadgeSize, string> = {
  sm: "h-[var(--size-chip-sm)] px-[var(--space-2-5)] text-micro",
  md: "h-[var(--size-chip-md)] px-[var(--space-3)] text-caption",
  lg: "h-[var(--size-chip-lg)] px-[var(--space-3-5)] text-body-sm"
};

export const BADGE_SHAPE_CLASS: Record<BadgeShape, string> = {
  pill: "rounded-full",
  rounded: "rounded-[var(--radius-md)]",
  square: "rounded-[var(--radius-sm)]"
};

export const BADGE_DOT_SIZE_CLASS: Record<BadgeSize, string> = {
  sm: "h-[var(--space-1-5)] w-[var(--space-1-5)]",
  md: "h-[var(--space-2)] w-[var(--space-2)]",
  lg: "h-[var(--space-2)] w-[var(--space-2)]"
};
