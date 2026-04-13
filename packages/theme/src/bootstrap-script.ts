import { THEME_COOKIE_KEY, THEME_COOKIE_MAX_AGE_SECONDS, THEME_STORAGE_KEY } from "./constants";

export const THEME_BOOTSTRAP_SCRIPT = `
(() => {
  try {
    const storageKey = "${THEME_STORAGE_KEY}";
    const cookieKey = "${THEME_COOKIE_KEY}";
    const cookieMaxAge = ${THEME_COOKIE_MAX_AGE_SECONDS};

    const normalizeTheme = (value) => {
      return value === "light" || value === "dark" || value === "system" ? value : null;
    };

    const writeThemeCookie = (themeValue) => {
      const cookieParts = [
        cookieKey + "=" + encodeURIComponent(themeValue),
        "path=/",
        "max-age=" + cookieMaxAge,
        "samesite=lax"
      ];
      document.cookie = cookieParts.join("; ");
    };

    const cookieMatch = document.cookie.match(new RegExp("(?:^|; )" + cookieKey + "=([^;]+)"));
    const cookieTheme = normalizeTheme(cookieMatch ? decodeURIComponent(cookieMatch[1]) : null);
    const storedTheme = normalizeTheme(localStorage.getItem(storageKey));
    const preferredTheme = cookieTheme || storedTheme || "light";
    const effectiveTheme = preferredTheme === "system" ? "light" : preferredTheme;

    localStorage.setItem(storageKey, effectiveTheme);
    writeThemeCookie(effectiveTheme);

    const isDark = effectiveTheme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  } catch {}
})();
`;
