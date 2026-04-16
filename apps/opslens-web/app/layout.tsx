import type { Metadata } from "next";
import { AppHead, appFont, createAppMetadata } from "@repo/theme";
import "./globals.css";
import { Providers } from "@/app/providers";
import { opslensClientEnv } from "@/lib/config";

export const metadata: Metadata = createAppMetadata({
  appName: opslensClientEnv.appTitle,
  description: "운영 로그/에러/배포 이력 분석 대시보드",
  appUrl: opslensClientEnv.appUrl,
  keywords: ["ops", "dashboard", "logs", "issues", "deployments"]
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <AppHead />
      </head>
      <body className={`${appFont.className} font-body text-foreground dark:text-foreground min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
