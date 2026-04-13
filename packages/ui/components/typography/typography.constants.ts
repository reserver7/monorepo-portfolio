import type { TypographyColor, TypographyVariant } from "./typography.types";
import { PRIMITIVE_COLOR_HUES, PRIMITIVE_COLOR_SCALES } from "../../styles/color-token";

export const TYPOGRAPHY_DEFAULTS = {
  as: "p",
  variant: "bodyMd",
  color: "default"
} as const;

export const TYPOGRAPHY_VARIANTS = [
  "headingXl",
  "headingLg",
  "headingMd",
  "title",
  "bodyMd",
  "bodySm",
  "caption",
  "micro",
  "label",
  "h1",
  "h2",
  "h3",
  "body"
] as const;

const TYPOGRAPHY_SEMANTIC_COLOR_CLASS_MAP = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  foreground: "text-foreground",
  muted: "text-muted",
  subtle: "text-muted-foreground",
  surface: "text-surface",
  surfaceElevated: "text-surface-elevated",
  border: "text-border",
  white: "text-white",
  black: "text-black"
} as const satisfies Record<string, string>;

const typographyPrimitiveColorClassMap = Object.fromEntries(
  PRIMITIVE_COLOR_HUES.flatMap((hue) => PRIMITIVE_COLOR_SCALES.map((scale) => [`${hue}${scale}`, `text-${hue}-${scale}`]))
) as Record<string, string>;

export const TYPOGRAPHY_COLORS = [
  ...Object.keys(TYPOGRAPHY_SEMANTIC_COLOR_CLASS_MAP),
  ...PRIMITIVE_COLOR_HUES.flatMap((hue) => PRIMITIVE_COLOR_SCALES.map((scale) => `${hue}${scale}`))
] as const;

export const TYPOGRAPHY_VARIANT_CLASS_MAP: Record<TypographyVariant, string> = {
  headingXl: "text-heading-xl",
  headingLg: "text-heading-lg",
  headingMd: "text-heading-md",
  title: "text-title",
  bodyMd: "text-body-md",
  bodySm: "text-body-sm",
  caption: "text-caption",
  micro: "text-micro",
  label: "text-body-md font-semibold",
  h1: "text-heading-xl",
  h2: "text-heading-lg",
  h3: "text-heading-md",
  body: "text-body-md"
};

export const TYPOGRAPHY_COLOR_CLASS_MAP: Record<TypographyColor, string> = {
  ...(TYPOGRAPHY_SEMANTIC_COLOR_CLASS_MAP as Record<TypographyColor, string>),
  ...(typographyPrimitiveColorClassMap as Record<TypographyColor, string>)
};
