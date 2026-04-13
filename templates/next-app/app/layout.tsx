import type { Metadata } from "next";
import { AppHead, appFont, createAppMetadata } from "@repo/theme";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = createAppMetadata({
  appName: process.env.NEXT_PUBLIC_APP_TITLE?.trim() || "__APP_TITLE__",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION?.trim() || "__APP_TITLE__ 서비스",
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  keywords: ["__APP_NAME__", "__APP_TITLE__", "nextjs", "monorepo", "design-system"]
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
