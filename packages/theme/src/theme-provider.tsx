"use client";

import { useEffect } from "react";
import { ThemeProvider, type ThemeProviderProps } from "next-themes";
import { THEME_STORAGE_KEY } from "./constants";

export type ResolvedTheme = "light" | "dark";

export type AppThemeProviderProps = Omit<ThemeProviderProps, "storageKey">;

function ThemeDomSync() {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const isDark = root.classList.contains("dark");
      root.style.colorScheme = isDark ? "dark" : "light";
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return null;
}

export function AppThemeProvider({ children, ...props }: AppThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      enableColorScheme
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
      {...props}
    >
      <ThemeDomSync />
      {children}
    </ThemeProvider>
  );
}
