import { CARD_DEFAULTS, CARD_PADDING_CLASS, CARD_RADIUS_CLASS, CARD_VARIANT_CLASS } from "./card.constants";
import type { CardProps } from "./card.types";

export const resolveCardRootClassName = ({
  variant = CARD_DEFAULTS.variant,
  interactive = CARD_DEFAULTS.interactive,
  padding = CARD_DEFAULTS.padding,
  radius = CARD_DEFAULTS.radius,
  bordered = CARD_DEFAULTS.bordered
}: Pick<CardProps, "variant" | "interactive" | "padding" | "radius" | "bordered">) => {
  const interactiveClassName = interactive ? "transition-all hover:-translate-y-0.5 hover:shadow-md" : "";

  return [
    CARD_RADIUS_CLASS[radius],
    bordered ? "border" : "border-0",
    CARD_VARIANT_CLASS[variant],
    CARD_PADDING_CLASS[padding],
    interactiveClassName
  ]
    .filter(Boolean)
    .join(" ");
};
