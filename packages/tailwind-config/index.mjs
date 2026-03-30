export const DEFAULT_TAILWIND_CONTENT = [
  "./app/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
  "./hooks/**/*.{ts,tsx}",
  "../../packages/ui/src/**/*.{ts,tsx}"
];

const BASE_THEME_EXTEND = {
  fontFamily: {
    heading: ["var(--font-heading)", "sans-serif"],
    body: ["var(--font-body)", "sans-serif"],
    mono: ["var(--font-mono)", "monospace"]
  },
  fontSize: {
    "display-2xl": ["clamp(2rem, 1.6rem + 1.8vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
    "display-xl": ["clamp(1.625rem, 1.35rem + 1.2vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.016em" }],
    "heading-xl": ["clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)", { lineHeight: "1.25", letterSpacing: "-0.012em" }],
    "heading-lg": ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
    "body-lg": ["1.0625rem", { lineHeight: "1.65" }],
    body: ["1rem", { lineHeight: "1.6" }],
    "body-sm": ["0.9375rem", { lineHeight: "1.55" }],
    caption: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.01em" }]
  },
  colors: {
    brand: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e"
    },
    surface: "rgb(var(--ds-surface) / <alpha-value>)",
    "surface-elevated": "rgb(var(--ds-surface-elevated) / <alpha-value>)",
    foreground: "rgb(var(--ds-foreground) / <alpha-value>)",
    muted: "rgb(var(--ds-muted) / <alpha-value>)",
    "muted-foreground": "rgb(var(--ds-muted-foreground) / <alpha-value>)",
    border: "rgb(var(--ds-border) / <alpha-value>)",
    primary: "rgb(var(--ds-primary) / <alpha-value>)",
    success: "rgb(var(--ds-success) / <alpha-value>)",
    warning: "rgb(var(--ds-warning) / <alpha-value>)",
    danger: "rgb(var(--ds-danger) / <alpha-value>)"
  }
};

/**
 * @param {{
 *   content?: string[];
 *   themeExtend?: Record<string, unknown>;
 *   plugins?: unknown[];
 * }} [options]
 */
export const createTailwindConfig = (options = {}) => {
  const { content = DEFAULT_TAILWIND_CONTENT, themeExtend = {}, plugins = [] } = options;
  const nextFontFamily = {
    ...BASE_THEME_EXTEND.fontFamily,
    ...(themeExtend.fontFamily ?? {})
  };
  const nextFontSize = {
    ...BASE_THEME_EXTEND.fontSize,
    ...(themeExtend.fontSize ?? {})
  };
  const nextColors = {
    ...BASE_THEME_EXTEND.colors,
    ...(themeExtend.colors ?? {})
  };
  const nextThemeExtend = {
    ...BASE_THEME_EXTEND,
    ...themeExtend,
    fontFamily: nextFontFamily,
    fontSize: nextFontSize,
    colors: nextColors
  };

  return {
    darkMode: "class",
    content,
    theme: {
      extend: nextThemeExtend
    },
    plugins
  };
};
