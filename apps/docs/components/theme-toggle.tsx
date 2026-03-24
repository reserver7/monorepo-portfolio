"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@repo/ui";

const THEME_COOKIE_KEY = "collab_theme";
const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const THEME_COOKIE_DOMAIN = process.env.NEXT_PUBLIC_THEME_COOKIE_DOMAIN?.trim() || "";

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.07 7.07-1.41-1.41M6.34 6.34 4.93 4.93m14.14 0-1.41 1.41M6.34 17.66l-1.41 1.41"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3c-.05.31-.08.63-.08.96A8 8 0 0 0 20 12c.33 0 .65-.03 1-.08Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const normalizedTheme =
      theme === "light" || theme === "dark" || theme === "system" ? theme : resolvedTheme;

    if (normalizedTheme !== "light" && normalizedTheme !== "dark" && normalizedTheme !== "system") {
      return;
    }

    const cookieParts = [
      `${THEME_COOKIE_KEY}=${encodeURIComponent(normalizedTheme)}`,
      "path=/",
      `max-age=${THEME_COOKIE_MAX_AGE_SECONDS}`,
      "samesite=lax"
    ];
    const isLocalHost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "::1";

    if (THEME_COOKIE_DOMAIN && !isLocalHost) {
      cookieParts.push(`domain=${THEME_COOKIE_DOMAIN}`);
    }

    document.cookie = cookieParts.join("; ");
  }, [mounted, resolvedTheme, theme]);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="fixed bottom-4 right-4 z-[80] rounded-full shadow-lg"
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
};
