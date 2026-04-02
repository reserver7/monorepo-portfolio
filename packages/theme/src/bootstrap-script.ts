import {
  THEME_COOKIE_KEY,
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_STORAGE_KEY,
  THEME_WINDOW_NAME_PREFIX
} from "./constants";

export const THEME_BOOTSTRAP_SCRIPT = `
(() => {
  try {
    const storageKey = "${THEME_STORAGE_KEY}";
    const cookieKey = "${THEME_COOKIE_KEY}";
    const cookieMaxAge = ${THEME_COOKIE_MAX_AGE_SECONDS};
    const windowNameThemePrefix = "${THEME_WINDOW_NAME_PREFIX}";
    const themeQueryKey = "theme";

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

    const readThemeFromQuery = () => {
      const params = new URLSearchParams(window.location.search);
      return normalizeTheme(params.get(themeQueryKey));
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

    const clearThemeQueryFromUrl = () => {
      const parsed = new URL(window.location.href);
      if (!parsed.searchParams.has(themeQueryKey)) {
        return;
      }
      parsed.searchParams.delete(themeQueryKey);
      window.history.replaceState({}, "", parsed.pathname + parsed.search + parsed.hash);
    };

    const cookieMatch = document.cookie.match(new RegExp("(?:^|; )" + cookieKey + "=([^;]+)"));
    const cookieTheme = normalizeTheme(cookieMatch ? decodeURIComponent(cookieMatch[1]) : null);
    const queryTheme = readThemeFromQuery();
    const windowNameTheme = readThemeFromWindowName();
    const storedTheme = normalizeTheme(localStorage.getItem(storageKey));
    // 앱 간(도메인/포트) 이동 시 전달된 값을 우선 적용한다.
    const preferredTheme = queryTheme || windowNameTheme || cookieTheme || storedTheme || "light";
    const effectiveTheme = preferredTheme === "system" ? "light" : preferredTheme;

    localStorage.setItem(storageKey, effectiveTheme);
    writeThemeCookie(effectiveTheme);
    clearThemeQueryFromUrl();

    const isDark = effectiveTheme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  } catch {}
})();
`;
