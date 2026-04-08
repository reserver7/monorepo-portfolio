import { SKELETON_DEFAULTS, SKELETON_SIZE_CLASS } from "./skeleton.constants";
import type { SkeletonSize, SkeletonVariant } from "./skeleton.types";

export function toCssLength(value: number | string | undefined) {
  if (value === undefined) return undefined;
  if (typeof value === "number") return `${value}px`;
  return value;
}

export function resolveSkeletonSizeClass(variant: SkeletonVariant, size: SkeletonSize | undefined) {
  const resolvedSize = size ?? SKELETON_DEFAULTS.size;
  return SKELETON_SIZE_CLASS[variant][resolvedSize];
}

export function clampLines(lines: number | undefined) {
  if (typeof lines !== "number" || Number.isNaN(lines)) {
    return SKELETON_DEFAULTS.lines;
  }
  return Math.max(1, Math.floor(lines));
}
