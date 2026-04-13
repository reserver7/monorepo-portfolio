import { THEME_COOKIE_KEY, THEME_COOKIE_MAX_AGE_SECONDS } from "./constants";

export type AppTheme = "light" | "dark" | "system";

export const normalizeTheme = (value: string | null | undefined): AppTheme | null => {
  return value === "light" || value === "dark" || value === "system" ? value : null;
};

export const isLocalHost = (hostname: string): boolean => {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
};

export const buildThemeCookie = (
  theme: AppTheme,
  options?: {
    domain?: string;
    currentHostname?: string;
  }
) => {
  const cookieParts = [
    `${THEME_COOKIE_KEY}=${encodeURIComponent(theme)}`,
    "path=/",
    `max-age=${THEME_COOKIE_MAX_AGE_SECONDS}`,
    "samesite=lax"
  ];

  const domain = options?.domain?.trim();
  const currentHostname = options?.currentHostname;

  if (domain && currentHostname && !isLocalHost(currentHostname)) {
    cookieParts.push(`domain=${domain}`);
  }

  return cookieParts.join("; ");
};
