"use client";

import * as React from "react";
import { cn } from "../cn";
import {
  SKELETON_ANIMATION_CLASS,
  SKELETON_COLOR_CLASS,
  SKELETON_DEFAULTS,
  SKELETON_SPEED_CLASS,
  SKELETON_VARIANT_CLASS
} from "./skeleton.constants";
import { clampLines, resolveSkeletonSizeClass, toCssLength } from "./skeleton.utils";
import type { SkeletonProps } from "./skeleton.types";

export const Skeleton = React.memo(function Skeleton({
  variant = SKELETON_DEFAULTS.variant,
  size = SKELETON_DEFAULTS.size,
  color = SKELETON_DEFAULTS.color,
  animation,
  speed = SKELETON_DEFAULTS.speed,
  lines = SKELETON_DEFAULTS.lines,
  lastLineWidth = SKELETON_DEFAULTS.lastLineWidth,
  fullWidth = SKELETON_DEFAULTS.fullWidth,
  className,
  shimmer = SKELETON_DEFAULTS.shimmer,
  style,
  ...props
}: SkeletonProps) {
  const resolvedAnimation = animation ?? (shimmer ? "pulse" : "none");
  const lineCount = variant === "text" ? clampLines(lines) : 1;
  const widthClass = fullWidth && variant !== "circular" ? "w-full" : "w-auto";

  const itemClassName = cn(
    "relative overflow-hidden",
    SKELETON_COLOR_CLASS[color],
    SKELETON_ANIMATION_CLASS[resolvedAnimation],
    resolvedAnimation === "pulse" ? SKELETON_SPEED_CLASS[speed] : null,
    SKELETON_VARIANT_CLASS[variant],
    resolveSkeletonSizeClass(variant, size),
    widthClass
  );

  const content = Array.from({ length: lineCount }, (_, index) => {
    const isLast = index === lineCount - 1;
    const lineStyle =
      variant === "text" && isLast && lineCount > 1
        ? { width: toCssLength(lastLineWidth) }
        : undefined;
    return <div key={`skeleton-line-${index}`} className={itemClassName} style={lineStyle} />;
  });

  if (lineCount > 1) {
    return (
      <div className={cn("grid gap-2", className)} style={style} {...props}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn(itemClassName, className)}
      style={style}
      {...props}
    />
  );
});
Skeleton.displayName = "Skeleton";
