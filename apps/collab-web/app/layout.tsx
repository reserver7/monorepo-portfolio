import type { Metadata } from "next";
import { AppHead, appFont, createAppMetadata } from "@repo/theme";
import { Providers } from "@/app/providers";
import { getAppMetadataText, resolveRequestLocale } from "@/lib/i18n/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveRequestLocale();
  const text = getAppMetadataText(locale);

  return createAppMetadata({
    appName: text.appName,
    description: text.description,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    keywords: text.keywords,
    locale: text.ogLocale
  });
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await resolveRequestLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <AppHead />
      </head>
      <body className={`${appFont.className} font-body text-foreground dark:text-foreground min-h-screen antialiased`}>
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
