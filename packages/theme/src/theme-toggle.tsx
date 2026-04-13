"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button, useMounted } from "@repo/ui";
import { buildThemeCookie, normalizeTheme } from "./theme.utils";

export interface ThemeToggleProps {
  className?: string;
}

const readThemeCookieDomain = () => {
  if (typeof process === "undefined" || !process.env) {
    return "";
  }
  return process.env.NEXT_PUBLIC_THEME_COOKIE_DOMAIN?.trim() || "";
};

const THEME_COOKIE_DOMAIN = readThemeCookieDomain();

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const normalizedTheme = normalizeTheme(theme) ?? normalizeTheme(resolvedTheme);

    if (!normalizedTheme) {
      return;
    }
    document.cookie = buildThemeCookie(normalizedTheme, {
      domain: THEME_COOKIE_DOMAIN,
      currentHostname: window.location.hostname
    });
  }, [mounted, resolvedTheme, theme]);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={className ?? "fixed bottom-4 right-4 z-[80] h-10 w-10 rounded-full p-0 shadow-lg"}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
