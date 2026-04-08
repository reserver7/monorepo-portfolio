import type { StatCardColor, StatCardSize } from "./stat-card.types";

export const STAT_CARD_DEFAULTS = {
  color: "default",
  size: "md"
} as const;

export const STAT_CARD_COLOR_CLASS: Record<StatCardColor, string> = {
  default: "border-default bg-surface",
  primary: "border-primary/30 bg-primary/5",
  danger: "border-danger/30 bg-danger/5",
  warning: "border-warning/30 bg-warning/5"
};

export const STAT_CARD_SIZE_CLASS: Record<StatCardSize, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5"
};
