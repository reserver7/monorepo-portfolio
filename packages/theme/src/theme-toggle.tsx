"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button, useMounted } from "@repo/ui";
import { THEME_COOKIE_KEY, THEME_COOKIE_MAX_AGE_SECONDS } from "./constants";

export interface ThemeToggleProps {
  className?: string;
}

const THEME_COOKIE_DOMAIN = process.env.NEXT_PUBLIC_THEME_COOKIE_DOMAIN?.trim() || "";

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

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
