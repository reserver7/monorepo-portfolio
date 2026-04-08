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
  destructive: "bg-danger/15 text-danger",
  info: "bg-info/15 text-info"
};

export const BADGE_SIZE_CLASS: Record<BadgeSize, string> = {
  sm: "h-5 px-2 text-caption",
  md: "h-6 px-2.5 text-body-sm",
  lg: "h-7 px-3 text-body-sm"
};

export const BADGE_SHAPE_CLASS: Record<BadgeShape, string> = {
  pill: "rounded-full",
  rounded: "rounded-md",
  square: "rounded-sm"
};

export const BADGE_DOT_SIZE_CLASS: Record<BadgeSize, string> = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2 w-2"
};
