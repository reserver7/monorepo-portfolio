"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "@repo/icons";
import { Button } from "@repo/ui";

const THEME_COOKIE_KEY = "collab_theme";
const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const THEME_COOKIE_DOMAIN = process.env.NEXT_PUBLIC_THEME_COOKIE_DOMAIN?.trim() || "";

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
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};
