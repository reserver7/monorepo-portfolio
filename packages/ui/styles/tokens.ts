export const TYPOGRAPHY_TOKENS = {
  headingXl: "var(--ds-font-size-heading-xl)",
  headingLg: "var(--ds-font-size-heading-lg)",
  headingMd: "var(--ds-font-size-heading-md)",
  bodyMd: "var(--ds-font-size-body-md)",
  bodySm: "var(--ds-font-size-body-sm)",
  caption: "var(--ds-font-size-caption)",
  lineHeightTight: "var(--ds-line-height-tight)",
  lineHeightNormal: "var(--ds-line-height-normal)",
  lineHeightRelaxed: "var(--ds-line-height-relaxed)",
  fontWeightRegular: "var(--ds-font-weight-regular)",
  fontWeightMedium: "var(--ds-font-weight-medium)",
  fontWeightSemibold: "var(--ds-font-weight-semibold)",
  fontWeightBold: "var(--ds-font-weight-bold)"
} as const;

export const SEMANTIC_COLOR_TOKENS = {
  background: "rgb(var(--ds-background))",
  foreground: "rgb(var(--ds-foreground))",
  surface: "rgb(var(--ds-surface))",
  surfaceElevated: "rgb(var(--ds-surface-elevated))",
  border: "rgb(var(--ds-border))",
  muted: "rgb(var(--ds-muted))",
  subtle: "rgb(var(--ds-muted-foreground))",
  primary: "rgb(var(--ds-primary))",
  primaryForeground: "rgb(var(--ds-primary-foreground))",
  success: "rgb(var(--ds-success))",
  successForeground: "rgb(var(--ds-success-foreground))",
  warning: "rgb(var(--ds-warning))",
  warningForeground: "rgb(var(--ds-warning-foreground))",
  danger: "rgb(var(--ds-danger))",
  dangerForeground: "rgb(var(--ds-danger-foreground))",
  info: "rgb(var(--ds-info))",
  infoForeground: "rgb(var(--ds-info-foreground))"
} as const;
