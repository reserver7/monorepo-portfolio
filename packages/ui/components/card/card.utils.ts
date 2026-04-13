import { resolveOption } from "../internal/resolve-option";
import { CARD_DEFAULTS, CARD_PADDING_CLASS, CARD_RADIUS_CLASS, CARD_VARIANT_CLASS } from "./card.constants";
import type { CardProps } from "./card.types";

export const resolveCardRootClassName = ({
  variant = CARD_DEFAULTS.variant,
  interactive = CARD_DEFAULTS.interactive,
  padding = CARD_DEFAULTS.padding,
  radius = CARD_DEFAULTS.radius,
  bordered = CARD_DEFAULTS.bordered
}: Pick<CardProps, "variant" | "interactive" | "padding" | "radius" | "bordered">) => {
  const resolvedVariant = resolveOption(variant, CARD_VARIANT_CLASS, CARD_DEFAULTS.variant);
  const resolvedPadding = resolveOption(padding, CARD_PADDING_CLASS, CARD_DEFAULTS.padding);
  const resolvedRadius = resolveOption(radius, CARD_RADIUS_CLASS, CARD_DEFAULTS.radius);
  const interactiveClassName = interactive
    ? "transition-shadow duration-200 hover:shadow-[var(--shadow-card)]"
    : "";

  return [
    CARD_RADIUS_CLASS[resolvedRadius],
    bordered ? "border border-default" : "border-0",
    CARD_VARIANT_CLASS[resolvedVariant],
    CARD_PADDING_CLASS[resolvedPadding],
    interactiveClassName
  ]
    .filter(Boolean)
    .join(" ");
};
