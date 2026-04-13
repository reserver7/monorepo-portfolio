import type { Metadata } from "next";
import { AppHead, appFont, createAppMetadata } from "@repo/theme";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = createAppMetadata({
  appName: "Collaborative Suite",
  description: "문서와 화이트보드를 하나의 워크스페이스에서 제공하는 실시간 협업 플랫폼",
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  keywords: ["협업", "문서", "화이트보드", "실시간 편집", "collaboration"]
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
