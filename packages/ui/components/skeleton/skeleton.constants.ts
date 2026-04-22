import type {
  SkeletonAnimation,
  SkeletonAnimationSpeed,
  SkeletonSize,
  SkeletonVariant
} from "./skeleton.types";

export const SKELETON_DEFAULTS = {
  variant: "rounded",
  size: "md",
  color: "default",
  animation: "pulse",
  speed: "normal",
  lines: 1,
  lastLineWidth: "70%",
  fullWidth: true,
  shimmer: true
} as const;

export const SKELETON_VARIANT_CLASS: Record<SkeletonVariant, string> = {
  rectangular: "rounded-none",
  rounded: "rounded-[var(--radius-md)]",
  circular: "rounded-full",
  text: "rounded-[var(--radius-sm)]"
};

export const SKELETON_COLOR_CLASS = {
  default: "bg-surface-elevated",
  muted: "bg-surface-elevated/70",
  subtle: "bg-surface-elevated/50"
} as const;

export const SKELETON_ANIMATION_CLASS: Record<SkeletonAnimation, string> = {
  pulse: "animate-pulse",
  none: ""
};

export const SKELETON_SPEED_CLASS: Record<SkeletonAnimationSpeed, string> = {
  slow: "[animation-duration:2s]",
  normal: "[animation-duration:1.5s]",
  fast: "[animation-duration:1s]"
};

export const SKELETON_SIZE_CLASS: Record<SkeletonVariant, Record<SkeletonSize, string>> = {
  text: {
    xs: "h-[var(--space-3)]",
    sm: "h-[var(--space-4)]",
    md: "h-[var(--size-control-sm)]",
    lg: "h-[var(--size-control-lg)]"
  },
  circular: {
    xs: "h-[var(--size-chip-sm)] w-[var(--size-chip-sm)]",
    sm: "h-[var(--size-control-sm)] w-[var(--size-control-sm)]",
    md: "h-[var(--size-control-lg)] w-[var(--size-control-lg)]",
    lg: "h-[var(--size-control-2xl)] w-[var(--size-control-2xl)]"
  },
  rounded: {
    xs: "h-[var(--size-chip-sm)]",
    sm: "h-[var(--size-control-sm)]",
    md: "h-[var(--size-control-lg)]",
    lg: "h-[var(--size-control-2xl)]"
  },
  rectangular: {
    xs: "h-[var(--size-control-2xl)]",
    sm: "h-[var(--space-16)]",
    md: "h-[var(--space-20)]",
    lg: "h-[var(--space-24)]"
  }
};
