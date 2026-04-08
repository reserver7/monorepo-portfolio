import { cn } from "../cn";
import { BADGE_SHAPE_CLASS, BADGE_SIZE_CLASS, BADGE_VARIANT_CLASS } from "./badge.constants";
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

  return cn(
    "inline-flex max-w-full items-center gap-1 font-semibold leading-none",
    BADGE_VARIANT_CLASS[variant],
    BADGE_SIZE_CLASS[size],
    BADGE_SHAPE_CLASS[shape],
    interactive ? "cursor-pointer transition hover:brightness-95 active:brightness-90" : null,
    truncate ? "truncate" : null,
    className
  );
};
