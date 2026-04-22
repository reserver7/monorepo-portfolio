import type { AvatarShape, AvatarSize, AvatarStatus } from "./avatar.types";

export const AVATAR_DEFAULTS = {
  size: "md" as AvatarSize,
  shape: "circle" as AvatarShape,
  color: "default" as const,
  showStatus: false,
  bordered: false,
  interactive: false,
  status: "offline" as AvatarStatus
};

export const AVATAR_SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "h-[var(--size-chip-sm)] w-[var(--size-chip-sm)] text-caption",
  sm: "h-[var(--size-control-sm)] w-[var(--size-control-sm)] text-body-xs",
  md: "h-[var(--size-control-lg)] w-[var(--size-control-lg)] text-body-sm",
  lg: "h-[var(--size-control-2xl)] w-[var(--size-control-2xl)] text-body-md",
  xl: "h-[var(--space-16)] w-[var(--space-16)] text-body-lg"
};

export const AVATAR_SHAPE_CLASS: Record<AvatarShape, string> = {
  circle: "rounded-full",
  rounded: "rounded-[var(--radius-lg)]",
  square: "rounded-none"
};

export const AVATAR_FALLBACK_COLOR_CLASS = {
  default: "bg-surface-elevated text-foreground",
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger"
} as const;

export const AVATAR_STATUS_COLOR_CLASS: Record<AvatarStatus, string> = {
  online: "bg-success",
  offline: "bg-muted",
  away: "bg-warning",
  busy: "bg-danger"
};

export const AVATAR_STATUS_SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "h-[var(--space-2)] w-[var(--space-2)]",
  sm: "h-[var(--space-2-5)] w-[var(--space-2-5)]",
  md: "h-[var(--space-3)] w-[var(--space-3)]",
  lg: "h-[var(--space-3-5)] w-[var(--space-3-5)]",
  xl: "h-[var(--space-4)] w-[var(--space-4)]"
};
