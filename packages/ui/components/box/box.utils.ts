import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { BOX_DEFAULTS, BOX_PADDING_CLASS, BOX_RADIUS_CLASS, BOX_SHADOW_CLASS, BOX_VARIANT_CLASS } from "./box.constants";
import type { BoxPadding, BoxRadius, BoxShadow, BoxVariant } from "./box.types";

export const getBoxClassName = (params: {
  variant: BoxVariant;
  padding: BoxPadding;
  radius: BoxRadius;
  shadow: BoxShadow;
  border: boolean;
  fullWidth: boolean;
  fullHeight: boolean;
  className?: string;
}) => {
  const { variant, padding, radius, shadow, border, fullWidth, fullHeight, className } = params;
  const resolvedVariant = resolveOption(variant, BOX_VARIANT_CLASS, BOX_DEFAULTS.variant);
  const resolvedPadding = resolveOption(padding, BOX_PADDING_CLASS, BOX_DEFAULTS.padding);
  const resolvedRadius = resolveOption(radius, BOX_RADIUS_CLASS, BOX_DEFAULTS.radius);
  const resolvedShadow = resolveOption(shadow, BOX_SHADOW_CLASS, BOX_DEFAULTS.shadow);

  return cn(
    BOX_VARIANT_CLASS[resolvedVariant],
    BOX_PADDING_CLASS[resolvedPadding],
    BOX_RADIUS_CLASS[resolvedRadius],
    BOX_SHADOW_CLASS[resolvedShadow],
    border ? "border border-default" : null,
    fullWidth ? "w-full" : null,
    fullHeight ? "h-full" : null,
    className
  );
};
