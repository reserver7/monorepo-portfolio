import { THEME_COOKIE_KEY, THEME_STORAGE_KEY, THEME_WINDOW_NAME_PREFIX } from "./constants";

export const THEME_BOOTSTRAP_SCRIPT = `
(() => {
  try {
    const storageKey = "${THEME_STORAGE_KEY}";
    const cookieKey = "${THEME_COOKIE_KEY}";
    const windowNameThemePrefix = "${THEME_WINDOW_NAME_PREFIX}";

    const normalizeTheme = (value) => {
      return value === "light" || value === "dark" || value === "system" ? value : null;
    };

    const readThemeFromWindowName = () => {
      if (!window.name || !window.name.startsWith(windowNameThemePrefix)) {
        return null;
      }
      const rawTheme = window.name.slice(windowNameThemePrefix.length);
      return normalizeTheme(rawTheme);
    };

    const cookieMatch = document.cookie.match(new RegExp("(?:^|; )" + cookieKey + "=([^;]+)"));
    const cookieTheme = normalizeTheme(cookieMatch ? decodeURIComponent(cookieMatch[1]) : null);
    const windowNameTheme = readThemeFromWindowName();
    const storedTheme = normalizeTheme(localStorage.getItem(storageKey));
    const effectiveTheme = windowNameTheme || cookieTheme || storedTheme || "system";

    localStorage.setItem(storageKey, effectiveTheme);

    const resolvedTheme =
      effectiveTheme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : effectiveTheme;

    const isDark = resolvedTheme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  } catch {}
})();
`;

