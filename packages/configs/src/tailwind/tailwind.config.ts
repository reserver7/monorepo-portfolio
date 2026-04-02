import type { Config } from "tailwindcss";

const semanticColors = {
  background: "rgb(var(--color-bg-canvas) / <alpha-value>)",
  foreground: "rgb(var(--color-fg-default) / <alpha-value>)",
  surface: "rgb(var(--color-bg-surface) / <alpha-value>)",
  "surface-elevated": "rgb(var(--color-bg-surface-raised) / <alpha-value>)",
  border: "rgb(var(--color-border-default) / <alpha-value>)",
  muted: "rgb(var(--color-fg-muted) / <alpha-value>)",
  "muted-foreground": "rgb(var(--color-fg-subtle) / <alpha-value>)",
  brand: "rgb(var(--color-accent-primary) / <alpha-value>)",
  primary: "rgb(var(--color-accent-primary) / <alpha-value>)",
  "primary-foreground": "rgb(var(--color-fg-on-accent) / <alpha-value>)",
  success: "rgb(var(--color-feedback-success) / <alpha-value>)",
  "success-foreground": "rgb(var(--color-fg-on-success) / <alpha-value>)",
  danger: "rgb(var(--color-feedback-danger) / <alpha-value>)",
  "danger-foreground": "rgb(var(--color-fg-on-danger) / <alpha-value>)",
  warning: "rgb(var(--color-feedback-warning) / <alpha-value>)",
  "warning-foreground": "rgb(var(--color-fg-on-warning) / <alpha-value>)",
  info: "rgb(var(--color-feedback-info) / <alpha-value>)",
  "info-foreground": "rgb(var(--color-fg-on-info) / <alpha-value>)",
};

const paletteColors = {
  blue: { 1000: "var(--BLUE-1000)", 900: "var(--BLUE-900)", 800: "var(--BLUE-800)", 700: "var(--BLUE-700)", 600: "var(--BLUE-600)", 500: "var(--BLUE-500)", 400: "var(--BLUE-400)", 300: "var(--BLUE-300)", 200: "var(--BLUE-200)", 100: "var(--BLUE-100)" },
  indigo: { 1000: "var(--INDIGO-1000)", 900: "var(--INDIGO-900)", 800: "var(--INDIGO-800)", 700: "var(--INDIGO-700)", 600: "var(--INDIGO-600)", 500: "var(--INDIGO-500)", 400: "var(--INDIGO-400)", 300: "var(--INDIGO-300)", 200: "var(--INDIGO-200)", 100: "var(--INDIGO-100)" },
  natural: { 1000: "var(--NATURAL-1000)", 900: "var(--NATURAL-900)", 800: "var(--NATURAL-800)", 700: "var(--NATURAL-700)", 600: "var(--NATURAL-600)", 500: "var(--NATURAL-500)", 400: "var(--NATURAL-400)", 300: "var(--NATURAL-300)", 200: "var(--NATURAL-200)", 100: "var(--NATURAL-100)" },
  green: { 1000: "var(--GREEN-1000)", 900: "var(--GREEN-900)", 800: "var(--GREEN-800)", 700: "var(--GREEN-700)", 600: "var(--GREEN-600)", 500: "var(--GREEN-500)", 400: "var(--GREEN-400)", 300: "var(--GREEN-300)", 200: "var(--GREEN-200)", 100: "var(--GREEN-100)" },
  red: { 1000: "var(--RED-1000)", 900: "var(--RED-900)", 800: "var(--RED-800)", 700: "var(--RED-700)", 600: "var(--RED-600)", 500: "var(--RED-500)", 400: "var(--RED-400)", 300: "var(--RED-300)", 200: "var(--RED-200)", 100: "var(--RED-100)" },
  yellow: { 1000: "var(--YELLOW-1000)", 900: "var(--YELLOW-900)", 800: "var(--YELLOW-800)", 700: "var(--YELLOW-700)", 600: "var(--YELLOW-600)", 500: "var(--YELLOW-500)", 400: "var(--YELLOW-400)", 300: "var(--YELLOW-300)", 200: "var(--YELLOW-200)", 100: "var(--YELLOW-100)" },
  sky: { 1000: "var(--SKY-1000)", 900: "var(--SKY-900)", 800: "var(--SKY-800)", 700: "var(--SKY-700)", 600: "var(--SKY-600)", 500: "var(--SKY-500)", 400: "var(--SKY-400)", 300: "var(--SKY-300)", 200: "var(--SKY-200)", 100: "var(--SKY-100)" },
};

const colors = {
  ...semanticColors,
  ...paletteColors,
};

const extend = {
  colors,
};

const theme = {
  extend,
};

const config: Pick<Config, "theme"> = {
  theme,
};

export default config;
