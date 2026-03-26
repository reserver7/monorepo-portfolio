import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "__APP_TITLE__",
  description: "__APP_TITLE__ application"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
