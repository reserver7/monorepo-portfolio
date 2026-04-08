import type { SpacingAxis, SpacingSize } from "./spacing.types";

export const SPACING_DEFAULTS = {
  size: "md" as SpacingSize,
  axis: "vertical" as SpacingAxis,
  responsive: false
};

export const SPACING_BLOCK_CLASS: Record<SpacingSize, string> = {
  "2xs": "h-1",
  xs: "h-2",
  sm: "h-3",
  md: "h-4",
  lg: "h-6",
  xl: "h-8",
  "2xl": "h-12"
};

export const SPACING_INLINE_CLASS: Record<SpacingSize, string> = {
  "2xs": "w-1",
  xs: "w-2",
  sm: "w-3",
  md: "w-4",
  lg: "w-6",
  xl: "w-8",
  "2xl": "w-12"
};

export const SPACING_SQUARE_CLASS: Record<SpacingSize, string> = {
  "2xs": "h-1 w-1",
  xs: "h-2 w-2",
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
  "2xl": "h-12 w-12"
};

export const SPACING_BLOCK_RESPONSIVE_CLASS: Record<SpacingSize, string> = {
  "2xs": "md:h-2",
  xs: "md:h-3",
  sm: "md:h-4",
  md: "md:h-6",
  lg: "md:h-8",
  xl: "md:h-12",
  "2xl": "md:h-16"
};

export const SPACING_INLINE_RESPONSIVE_CLASS: Record<SpacingSize, string> = {
  "2xs": "md:w-2",
  xs: "md:w-3",
  sm: "md:w-4",
  md: "md:w-6",
  lg: "md:w-8",
  xl: "md:w-12",
  "2xl": "md:w-16"
};

export const SPACING_SQUARE_RESPONSIVE_CLASS: Record<SpacingSize, string> = {
  "2xs": "md:h-2 md:w-2",
  xs: "md:h-3 md:w-3",
  sm: "md:h-4 md:w-4",
  md: "md:h-6 md:w-6",
  lg: "md:h-8 md:w-8",
  xl: "md:h-12 md:w-12",
  "2xl": "md:h-16 md:w-16"
};
