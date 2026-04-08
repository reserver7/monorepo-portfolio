import type { BoxPadding, BoxRadius, BoxShadow, BoxVariant } from "./box.types";

export const BOX_DEFAULTS = {
  variant: "plain" as BoxVariant,
  padding: "none" as BoxPadding,
  radius: "none" as BoxRadius,
  shadow: "none" as BoxShadow,
  border: false,
  fullWidth: false,
  fullHeight: false
};

export const BOX_VARIANT_CLASS: Record<BoxVariant, string> = {
  plain: "",
  surface: "bg-surface",
  elevated: "bg-surface-elevated",
  muted: "bg-muted/25"
};

export const BOX_PADDING_CLASS: Record<BoxPadding, string> = {
  none: "",
  xs: "p-2",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8"
};

export const BOX_RADIUS_CLASS: Record<BoxRadius, string> = {
  none: "",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full"
};

export const BOX_SHADOW_CLASS: Record<BoxShadow, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg"
};

