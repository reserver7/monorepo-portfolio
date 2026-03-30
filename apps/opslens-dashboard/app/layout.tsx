import type { Metadata } from "next";
import { THEME_BOOTSTRAP_SCRIPT } from "@repo/theme";
import "./globals.css";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "OpsLens AI",
  description: "운영 로그/에러/배포 이력 분석 대시보드"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="font-body min-h-screen text-foreground antialiased transition-colors dark:text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
