import { cn } from "../cn";
import {
  SPACING_BLOCK_CLASS,
  SPACING_BLOCK_RESPONSIVE_CLASS,
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
  const responsiveClass =
    responsive && axis === "vertical"
      ? SPACING_BLOCK_RESPONSIVE_CLASS[size]
      : responsive && axis === "horizontal"
        ? SPACING_INLINE_RESPONSIVE_CLASS[size]
        : responsive && axis === "both"
          ? SPACING_SQUARE_RESPONSIVE_CLASS[size]
          : null;

  return cn(
    "shrink-0 pointer-events-none",
    axis === "vertical" ? SPACING_BLOCK_CLASS[size] : null,
    axis === "horizontal" ? SPACING_INLINE_CLASS[size] : null,
    axis === "both" ? SPACING_SQUARE_CLASS[size] : null,
    responsiveClass,
    className
  );
};
