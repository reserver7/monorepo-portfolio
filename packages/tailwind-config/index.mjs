export const DEFAULT_TAILWIND_CONTENT = [
  "./app/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
  "./hooks/**/*.{ts,tsx}",
  "../../packages/ui/src/**/*.{ts,tsx}"
];

const BASE_THEME_EXTEND = {
  fontFamily: {
    heading: ["var(--font-heading)", "sans-serif"],
    body: ["var(--font-body)", "sans-serif"]
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
  const nextThemeExtend = {
    ...BASE_THEME_EXTEND,
    ...themeExtend,
    fontFamily: {
      ...BASE_THEME_EXTEND.fontFamily,
      ...(themeExtend.fontFamily ?? {})
    }
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
