import type { Metadata } from "next";
import { AppHead, appFont, createAppMetadata } from "@repo/theme";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = createAppMetadata({
  appName: "Realtime Whiteboard",
  description: "Collaborative whiteboard with drag, cursor sync, and undo/redo",
  appUrl: process.env.NEXT_PUBLIC_WHITEBOARD_APP_URL,
  keywords: ["화이트보드", "실시간 협업", "드로잉", "whiteboard", "realtime"]
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
