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
    xs: "h-3",
    sm: "h-4",
    md: "h-5",
    lg: "h-6"
  },
  circular: {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  },
  rounded: {
    xs: "h-6",
    sm: "h-8",
    md: "h-10",
    lg: "h-12"
  },
  rectangular: {
    xs: "h-12",
    sm: "h-16",
    md: "h-20",
    lg: "h-24"
  }
};
