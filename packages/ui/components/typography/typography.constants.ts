import type { TypographyColor, TypographyVariant } from "./typography.types";

export const TYPOGRAPHY_DEFAULTS = {
  as: "p",
  variant: "body",
  color: "default"
} as const;

export const TYPOGRAPHY_VARIANTS = ["h1", "h2", "h3", "title", "body", "bodySm", "caption", "label"] as const;
export const TYPOGRAPHY_COLORS = ["default", "muted", "subtle", "primary", "success", "warning", "danger", "info"] as const;

export const TYPOGRAPHY_VARIANT_CLASS_MAP: Record<TypographyVariant, string> = {
  h1: "text-heading-xl",
  h2: "text-heading-lg",
  h3: "text-heading-md",
  title: "text-heading-md",
  body: "text-body-md",
  bodySm: "text-body-sm",
  caption: "text-caption",
  label: "text-caption font-semibold"
};

export const TYPOGRAPHY_COLOR_CLASS_MAP: Record<TypographyColor, string> = {
  default: "text-foreground",
  muted: "text-muted",
  subtle: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info"
};
