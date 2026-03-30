"use client";

import { ThemeProvider, type ThemeProviderProps } from "next-themes";
import { THEME_STORAGE_KEY } from "./constants";

export type AppTheme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export type AppThemeProviderProps = Omit<ThemeProviderProps, "storageKey">;

export function AppThemeProvider({ children, ...props }: AppThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey={THEME_STORAGE_KEY} {...props}>
      {children}
    </ThemeProvider>
  );
}
