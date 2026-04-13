const PRIMITIVE_COLOR_HUE_VALUES = [
  "blue",
  "indigo",
  "natural",
  "gray",
  "green",
  "red",
  "yellow",
  "sky",
  "orange",
  "purple"
] as const;

const PRIMITIVE_COLOR_SCALE_VALUES = ["1000", "900", "800", "700", "600", "500", "400", "300", "200", "100"] as const;

const SEMANTIC_COLOR_TOKEN_VALUES = [
  "background",
  "text",
  "primary",
  "primaryText",
  "link",
  "linkDark",
  "success",
  "successText",
  "warning",
  "warningText",
  "danger",
  "dangerText",
  "info",
  "infoText",
  "muted",
  "subtle",
  "surface",
  "surfaceElevated",
  "border",
  "white",
  "black"
] as const;

const SEMANTIC_COLOR_CSS_VALUE_MAP: Record<SemanticColorToken, string> = {
  background: "rgb(var(--color-bg-canvas))",
  text: "rgb(var(--color-fg-default))",
  primary: "rgb(var(--color-accent-primary))",
  primaryText: "rgb(var(--color-fg-on-accent))",
  link: "rgb(var(--color-accent-link))",
  linkDark: "rgb(var(--color-accent-link-dark))",
  success: "rgb(var(--color-feedback-success))",
  successText: "rgb(var(--color-fg-on-success))",
  warning: "rgb(var(--color-feedback-warning))",
  warningText: "rgb(var(--color-fg-on-warning))",
  danger: "rgb(var(--color-feedback-danger))",
  dangerText: "rgb(var(--color-fg-on-danger))",
  info: "rgb(var(--color-feedback-info))",
  infoText: "rgb(var(--color-fg-on-info))",
  muted: "rgb(var(--color-fg-muted))",
  subtle: "rgb(var(--color-fg-subtle))",
  surface: "rgb(var(--color-bg-surface))",
  surfaceElevated: "rgb(var(--color-bg-surface-raised))",
  border: "rgb(var(--color-border-default))",
  white: "#FFFFFF",
  black: "#000000"
};

export const PRIMITIVE_COLOR_HUES = PRIMITIVE_COLOR_HUE_VALUES;
export const PRIMITIVE_COLOR_SCALES = PRIMITIVE_COLOR_SCALE_VALUES;
export const SEMANTIC_COLOR_TOKEN_KEYS = SEMANTIC_COLOR_TOKEN_VALUES;

export type PrimitiveColorHue = (typeof PRIMITIVE_COLOR_HUE_VALUES)[number];
export type PrimitiveColorScale = (typeof PRIMITIVE_COLOR_SCALE_VALUES)[number];
export type PrimitiveColorToken = `${PrimitiveColorHue}${PrimitiveColorScale}`;
export type SemanticColorToken = (typeof SEMANTIC_COLOR_TOKEN_VALUES)[number];
export type UiColorToken = SemanticColorToken | PrimitiveColorToken;

const primitiveTokenRegex = new RegExp(`^(${PRIMITIVE_COLOR_HUE_VALUES.join("|")})(${PRIMITIVE_COLOR_SCALE_VALUES.join("|")})$`);

export const resolveUiColorValue = (token?: string): string | undefined => {
  if (!token) return undefined;

  if (Object.prototype.hasOwnProperty.call(SEMANTIC_COLOR_CSS_VALUE_MAP, token)) {
    return SEMANTIC_COLOR_CSS_VALUE_MAP[token as SemanticColorToken];
  }

  const match = primitiveTokenRegex.exec(token);
  if (!match) return undefined;

  const [, hue, scale] = match;
  if (!hue || !scale) return undefined;
  return `var(--${hue.toUpperCase()}-${scale})`;
};
