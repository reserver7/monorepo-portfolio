import type { CardPadding, CardRadius, CardVariant } from "./card.types";

export const CARD_DEFAULTS = {
  variant: "default",
  interactive: false,
  padding: "md",
  radius: "xl",
  bordered: false
} as const;

export const CARD_VARIANT_CLASS: Record<CardVariant, string> = {
  default: "bg-surface shadow-none",
  elevated: "bg-surface-elevated shadow-[var(--shadow-card)]",
  muted: "bg-surface-elevated shadow-none",
  ghost: "bg-transparent shadow-none"
};

export const CARD_PADDING_CLASS: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6"
};

export const CARD_RADIUS_CLASS: Record<CardRadius, string> = {
  md: "rounded-[var(--radius-md)]",
  lg: "rounded-[var(--radius-lg)]",
  xl: "rounded-[var(--radius-xl)]"
};

export const CARD_SECTION_PADDING_CLASS: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6"
};
