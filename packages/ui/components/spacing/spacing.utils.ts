import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import {
  SPACING_BLOCK_CLASS,
  SPACING_BLOCK_RESPONSIVE_CLASS,
  SPACING_DEFAULTS,
  SPACING_INLINE_CLASS,
  SPACING_INLINE_RESPONSIVE_CLASS,
  SPACING_SQUARE_CLASS,
  SPACING_SQUARE_RESPONSIVE_CLASS
} from "./spacing.constants";
import type { SpacingAxis, SpacingSize } from "./spacing.types";

export const getSpacingClassName = (params: {
  size: SpacingSize;
  axis: SpacingAxis;
  responsive: boolean;
  className?: string;
}) => {
  const { size, axis, responsive, className } = params;
  const resolvedSize = resolveOption(size, SPACING_BLOCK_CLASS, SPACING_DEFAULTS.size);
  const resolvedAxis = resolveOption(axis, { vertical: true, horizontal: true, both: true }, SPACING_DEFAULTS.axis);
  const responsiveClass =
    responsive && resolvedAxis === "vertical"
      ? SPACING_BLOCK_RESPONSIVE_CLASS[resolvedSize]
      : responsive && resolvedAxis === "horizontal"
        ? SPACING_INLINE_RESPONSIVE_CLASS[resolvedSize]
        : responsive && resolvedAxis === "both"
          ? SPACING_SQUARE_RESPONSIVE_CLASS[resolvedSize]
          : null;

  return cn(
    "shrink-0 pointer-events-none",
    resolvedAxis === "vertical" ? SPACING_BLOCK_CLASS[resolvedSize] : null,
    resolvedAxis === "horizontal" ? SPACING_INLINE_CLASS[resolvedSize] : null,
    resolvedAxis === "both" ? SPACING_SQUARE_CLASS[resolvedSize] : null,
    responsiveClass,
    className
  );
};
