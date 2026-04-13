"use client";

import * as React from "react";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { resolveUiColorValue } from "../../styles/color-token";
import {
  SKELETON_ANIMATION_CLASS,
  SKELETON_COLOR_CLASS,
  SKELETON_DEFAULTS,
  SKELETON_SIZE_CLASS,
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
  const resolvedVariant = resolveOption(variant, SKELETON_VARIANT_CLASS, SKELETON_DEFAULTS.variant);
  const requestedAnimation = animation ?? (shimmer ? "pulse" : "none");
  const resolvedAnimation = resolveOption(requestedAnimation, SKELETON_ANIMATION_CLASS, SKELETON_DEFAULTS.animation);
  const hasPresetColor = Object.prototype.hasOwnProperty.call(SKELETON_COLOR_CLASS, color);
  const resolvedColor = hasPresetColor
    ? resolveOption(color as keyof typeof SKELETON_COLOR_CLASS, SKELETON_COLOR_CLASS, SKELETON_DEFAULTS.color)
    : SKELETON_DEFAULTS.color;
  const tokenColorValue = hasPresetColor ? undefined : resolveUiColorValue(color);
  const resolvedSpeed = resolveOption(speed, SKELETON_SPEED_CLASS, SKELETON_DEFAULTS.speed);
  const resolvedSize = resolveOption(size, SKELETON_SIZE_CLASS[resolvedVariant], SKELETON_DEFAULTS.size);
  const lineCount = resolvedVariant === "text" ? clampLines(lines) : 1;
  const widthClass = fullWidth && resolvedVariant !== "circular" ? "w-full" : "w-auto";

  const itemClassName = cn(
    "relative overflow-hidden",
    SKELETON_COLOR_CLASS[resolvedColor],
    SKELETON_ANIMATION_CLASS[resolvedAnimation],
    resolvedAnimation === "pulse" ? SKELETON_SPEED_CLASS[resolvedSpeed] : null,
    SKELETON_VARIANT_CLASS[resolvedVariant],
    resolveSkeletonSizeClass(resolvedVariant, resolvedSize),
    widthClass
  );

  const content = Array.from({ length: lineCount }, (_, index) => {
    const isLast = index === lineCount - 1;
    const lineStyle =
      resolvedVariant === "text" && isLast && lineCount > 1
        ? { width: toCssLength(lastLineWidth) }
        : undefined;
    return (
      <div
        key={`skeleton-line-${index}`}
        className={itemClassName}
        style={tokenColorValue ? { ...(lineStyle ?? {}), backgroundColor: tokenColorValue } : lineStyle}
      />
    );
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
      style={tokenColorValue ? { ...(style ?? {}), backgroundColor: tokenColorValue } : style}
      {...props}
    />
  );
});
Skeleton.displayName = "Skeleton";
