import type { Metadata } from "next";
import { AppHead, createAppMetadata } from "@repo/theme";
import "./globals.css";
import { Providers } from "@/app/providers";

export const metadata: Metadata = createAppMetadata({
  appName: "OpsLens AI",
  description: "운영 로그/에러/배포 이력 분석 대시보드",
  appUrl: process.env.NEXT_PUBLIC_OPSLENS_APP_URL,
  keywords: ["ops", "dashboard", "logs", "issues", "deployments"]
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <AppHead />
      </head>
      <body className="font-body text-foreground dark:text-foreground min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
