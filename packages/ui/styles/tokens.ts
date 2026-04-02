export const TYPOGRAPHY_TOKENS = {
  headingXl: "var(--font-size-heading-xl)",
  headingLg: "var(--font-size-heading-lg)",
  headingMd: "var(--font-size-heading-md)",
  bodyMd: "var(--font-size-body-md)",
  bodySm: "var(--font-size-body-sm)",
  caption: "var(--font-size-caption)",
  lineHeightTight: "var(--line-height-tight)",
  lineHeightNormal: "var(--line-height-normal)",
  lineHeightRelaxed: "var(--line-height-relaxed)",
  fontWeightRegular: "var(--font-weight-regular)",
  fontWeightMedium: "var(--font-weight-medium)",
  fontWeightSemibold: "var(--font-weight-semibold)",
  fontWeightBold: "var(--font-weight-bold)"
} as const;

export const SEMANTIC_COLOR_TOKENS = {
  background: "rgb(var(--color-bg-canvas))",
  foreground: "rgb(var(--color-fg-default))",
  surface: "rgb(var(--color-bg-surface))",
  surfaceElevated: "rgb(var(--color-bg-surface-raised))",
  border: "rgb(var(--color-border-default))",
  muted: "rgb(var(--color-fg-muted))",
  subtle: "rgb(var(--color-fg-subtle))",
  primary: "rgb(var(--color-accent-primary))",
  primaryForeground: "rgb(var(--color-fg-on-accent))",
  success: "rgb(var(--color-feedback-success))",
  successForeground: "rgb(var(--color-fg-on-success))",
  warning: "rgb(var(--color-feedback-warning))",
  warningForeground: "rgb(var(--color-fg-on-warning))",
  danger: "rgb(var(--color-feedback-danger))",
  dangerForeground: "rgb(var(--color-fg-on-danger))",
  info: "rgb(var(--color-feedback-info))",
  infoForeground: "rgb(var(--color-fg-on-info))"
} as const;
