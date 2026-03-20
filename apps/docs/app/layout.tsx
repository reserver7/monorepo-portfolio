import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

const themeBootstrapScript = `
(() => {
  try {
    const cookieMatch = document.cookie.match(/(?:^|; )collab_theme=([^;]+)/);
    const cookieTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
    if (cookieTheme === "light" || cookieTheme === "dark") {
      localStorage.setItem("collab-theme", cookieTheme);
      if (cookieTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  } catch {}
})();
`;

export const metadata: Metadata = {
  title: "Collaborative Docs MVP",
  description: "Real-time collaborative document editor built with Next.js + Socket.io"
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
