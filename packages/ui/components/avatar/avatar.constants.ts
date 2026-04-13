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
  xs: "h-6 w-6 text-caption",
  sm: "h-8 w-8 text-body-xs",
  md: "h-10 w-10 text-body-sm",
  lg: "h-12 w-12 text-body-md",
  xl: "h-16 w-16 text-body-lg"
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
  xs: "h-2 w-2",
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
  xl: "h-4 w-4"
};
