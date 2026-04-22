import type { SpacingAxis, SpacingSize } from "./spacing.types";

export const SPACING_DEFAULTS = {
  size: "md" as SpacingSize,
  axis: "vertical" as SpacingAxis,
  responsive: false
};

export const SPACING_BLOCK_CLASS: Record<SpacingSize, string> = {
  "2xs": "h-[var(--space-1)]",
  xs: "h-[var(--space-2)]",
  sm: "h-[var(--space-3)]",
  md: "h-[var(--space-4)]",
  lg: "h-[var(--space-6)]",
  xl: "h-[var(--space-8)]",
  "2xl": "h-[var(--space-12)]"
};

export const SPACING_INLINE_CLASS: Record<SpacingSize, string> = {
  "2xs": "w-[var(--space-1)]",
  xs: "w-[var(--space-2)]",
  sm: "w-[var(--space-3)]",
  md: "w-[var(--space-4)]",
  lg: "w-[var(--space-6)]",
  xl: "w-[var(--space-8)]",
  "2xl": "w-[var(--space-12)]"
};

export const SPACING_SQUARE_CLASS: Record<SpacingSize, string> = {
  "2xs": "h-[var(--space-1)] w-[var(--space-1)]",
  xs: "h-[var(--space-2)] w-[var(--space-2)]",
  sm: "h-[var(--space-3)] w-[var(--space-3)]",
  md: "h-[var(--space-4)] w-[var(--space-4)]",
  lg: "h-[var(--space-6)] w-[var(--space-6)]",
  xl: "h-[var(--space-8)] w-[var(--space-8)]",
  "2xl": "h-[var(--space-12)] w-[var(--space-12)]"
};

export const SPACING_BLOCK_RESPONSIVE_CLASS: Record<SpacingSize, string> = {
  "2xs": "md:h-[var(--space-2)]",
  xs: "md:h-[var(--space-3)]",
  sm: "md:h-[var(--space-4)]",
  md: "md:h-[var(--space-6)]",
  lg: "md:h-[var(--space-8)]",
  xl: "md:h-[var(--space-12)]",
  "2xl": "md:h-[var(--space-16)]"
};

export const SPACING_INLINE_RESPONSIVE_CLASS: Record<SpacingSize, string> = {
  "2xs": "md:w-[var(--space-2)]",
  xs: "md:w-[var(--space-3)]",
  sm: "md:w-[var(--space-4)]",
  md: "md:w-[var(--space-6)]",
  lg: "md:w-[var(--space-8)]",
  xl: "md:w-[var(--space-12)]",
  "2xl": "md:w-[var(--space-16)]"
};

export const SPACING_SQUARE_RESPONSIVE_CLASS: Record<SpacingSize, string> = {
  "2xs": "md:h-[var(--space-2)] md:w-[var(--space-2)]",
  xs: "md:h-[var(--space-3)] md:w-[var(--space-3)]",
  sm: "md:h-[var(--space-4)] md:w-[var(--space-4)]",
  md: "md:h-[var(--space-6)] md:w-[var(--space-6)]",
  lg: "md:h-[var(--space-8)] md:w-[var(--space-8)]",
  xl: "md:h-[var(--space-12)] md:w-[var(--space-12)]",
  "2xl": "md:h-[var(--space-16)] md:w-[var(--space-16)]"
};
