import type { CardPadding, CardRadius, CardVariant } from "./card.types";

export const CARD_DEFAULTS = {
  variant: "default",
  interactive: false,
  padding: "md",
  radius: "xl",
  bordered: true
} as const;

export const CARD_VARIANT_CLASS: Record<CardVariant, string> = {
  default: "border-default bg-surface shadow-sm",
  elevated: "border-default bg-surface-elevated shadow-md",
  muted: "border-default bg-surface-elevated shadow-sm",
  ghost: "border-primary/20 bg-primary/6 shadow-none"
};

export const CARD_PADDING_CLASS: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6"
};

export const CARD_RADIUS_CLASS: Record<CardRadius, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl"
};

export const CARD_SECTION_PADDING_CLASS: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6"
};
