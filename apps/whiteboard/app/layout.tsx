import type { Metadata } from "next";
import { THEME_BOOTSTRAP_SCRIPT } from "@repo/theme";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Realtime Whiteboard",
  description: "Collaborative whiteboard with drag, cursor sync, and undo/redo"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="font-body text-foreground dark:text-foreground min-h-screen antialiased transition-colors">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
