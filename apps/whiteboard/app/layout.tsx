import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

const themeBootstrapScript = `
(() => {
  try {
    const storageKey = "collab-theme";
    const cookieKey = "collab_theme";

    const normalizeTheme = (value) => {
      return value === "light" || value === "dark" || value === "system" ? value : null;
    };

    const cookieMatch = document.cookie.match(new RegExp("(?:^|; )" + cookieKey + "=([^;]+)"));
    const cookieTheme = normalizeTheme(cookieMatch ? decodeURIComponent(cookieMatch[1]) : null);
    const storedTheme = normalizeTheme(localStorage.getItem(storageKey));
    const effectiveTheme = cookieTheme || storedTheme || "system";

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

export const metadata: Metadata = {
  title: "Realtime Whiteboard",
  description: "Collaborative whiteboard with drag, cursor sync, and undo/redo"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="font-body min-h-screen text-slate-900 antialiased transition-colors dark:text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
