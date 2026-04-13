import * as React from "react";
import type { UiColorToken } from "../../styles/color-token";

export type SkeletonVariant = "rectangular" | "rounded" | "circular" | "text";
export type SkeletonSize = "xs" | "sm" | "md" | "lg";
export type SkeletonColor = "default" | "muted" | "subtle" | UiColorToken;
export type SkeletonAnimation = "pulse" | "none";
export type SkeletonAnimationSpeed = "slow" | "normal" | "fast";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  size?: SkeletonSize;
  color?: SkeletonColor;
  animation?: SkeletonAnimation;
  speed?: SkeletonAnimationSpeed;
  lines?: number;
  lastLineWidth?: number | string;
  fullWidth?: boolean;
  shimmer?: boolean;
}
