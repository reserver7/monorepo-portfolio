import { PALETTE, STATE_COLOR } from "./palette";

export const typographyTokens = {
  fontFamily: {
    heading: "var(--font-heading)",
    body: "var(--font-body)",
    mono: "var(--font-mono)"
  },
  scale: {
    display2xl: "text-display-2xl",
    displayXl: "text-display-xl",
    headingXl: "text-heading-xl",
    headingLg: "text-heading-lg",
    bodyLg: "text-body-lg",
    body: "text-body",
    bodySm: "text-body-sm",
    caption: "text-caption"
  }
} as const;

export const colorTokens = {
  background: "rgb(var(--ds-background))",
  surface: "rgb(var(--ds-surface))",
  surfaceElevated: "rgb(var(--ds-surface-elevated))",
  foreground: "rgb(var(--ds-foreground))",
  muted: "rgb(var(--ds-muted))",
  mutedForeground: "rgb(var(--ds-muted-foreground))",
  border: "rgb(var(--ds-border))",
  primary: "rgb(var(--ds-primary))",
  success: "rgb(var(--ds-success))",
  warning: "rgb(var(--ds-warning))",
  danger: "rgb(var(--ds-danger))"
} as const;

export const semanticColorTokens = {
  light: {
    background: PALETTE.NATURAL_100,
    surface: PALETTE.WHITE,
    surfaceElevated: PALETTE.NATURAL_200,
    foreground: PALETTE.NATURAL_1000,
    muted: PALETTE.NATURAL_700,
    mutedForeground: PALETTE.NATURAL_600,
    border: PALETTE.NATURAL_300,
    primary: STATE_COLOR.PRIMARY,
    success: STATE_COLOR.SUCCESS,
    warning: STATE_COLOR.WARNING,
    danger: STATE_COLOR.DANGER
  },
  dark: {
    background: "#020617",
    surface: "#0F172A",
    surfaceElevated: "#1E293B",
    foreground: "#F1F5F9",
    muted: "#CBD5E1",
    mutedForeground: "#94A3B8",
    border: "#334155",
    primary: PALETTE.BLUE_500,
    success: PALETTE.GREEN_500,
    warning: PALETTE.YELLOW_500,
    danger: PALETTE.RED_500
  }
} as const;

export const chartColorTokens = {
  severity: {
    critical: STATE_COLOR.DANGER,
    high: PALETTE.ORANGE_600,
    medium: STATE_COLOR.WARNING,
    low: STATE_COLOR.PRIMARY
  },
  trend: STATE_COLOR.PRIMARY,
  bar: PALETTE.BLUE_600,
  fallback: PALETTE.GRAY_600
} as const;
