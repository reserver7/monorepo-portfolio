import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { BADGE_DEFAULTS, BADGE_SHAPE_CLASS, BADGE_SIZE_CLASS, BADGE_VARIANT_CLASS } from "./badge.constants";
import type { BadgeShape, BadgeSize, BadgeVariant } from "./badge.types";

export const getBadgeRootClassName = (params: {
  variant: BadgeVariant;
  size: BadgeSize;
  shape: BadgeShape;
  interactive: boolean;
  truncate: boolean;
  className?: string;
}) => {
  const { variant, size, shape, interactive, truncate, className } = params;
  const resolvedVariant = resolveOption(variant, BADGE_VARIANT_CLASS, BADGE_DEFAULTS.variant);
  const resolvedSize = resolveOption(size, BADGE_SIZE_CLASS, BADGE_DEFAULTS.size);
  const resolvedShape = resolveOption(shape, BADGE_SHAPE_CLASS, BADGE_DEFAULTS.shape);

  return cn(
    "inline-flex max-w-full items-center gap-1 font-semibold leading-none",
    BADGE_VARIANT_CLASS[resolvedVariant],
    BADGE_SIZE_CLASS[resolvedSize],
    BADGE_SHAPE_CLASS[resolvedShape],
    interactive ? "cursor-pointer transition hover:brightness-95 active:brightness-90" : null,
    truncate ? "truncate" : null,
    className
  );
};
