import type { Metadata } from "next";
import { AppHead, appFont, createAppMetadata } from "@repo/theme";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = createAppMetadata({
  appName: "Collaborative Docs",
  description: "Real-time collaborative document editor built with Next.js + Socket.io",
  appUrl: process.env.NEXT_PUBLIC_DOCS_APP_URL,
  keywords: ["협업", "문서", "실시간 편집", "collaboration", "docs"]
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <AppHead />
      </head>
      <body className={`${appFont.className} font-body text-foreground dark:text-foreground min-h-screen antialiased transition-colors`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
