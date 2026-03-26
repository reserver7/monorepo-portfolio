import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout";

export const metadata: Metadata = {
  title: "OpsLens AI",
  description: "운영 로그/에러/배포 이력 분석 대시보드"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-body min-h-screen text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
