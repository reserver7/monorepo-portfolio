import { cn } from "../cn";
import { BOX_PADDING_CLASS, BOX_RADIUS_CLASS, BOX_SHADOW_CLASS, BOX_VARIANT_CLASS } from "./box.constants";
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

  return cn(
    BOX_VARIANT_CLASS[variant],
    BOX_PADDING_CLASS[padding],
    BOX_RADIUS_CLASS[radius],
    BOX_SHADOW_CLASS[shadow],
    border ? "border border-default" : null,
    fullWidth ? "w-full" : null,
    fullHeight ? "h-full" : null,
    className
  );
};

