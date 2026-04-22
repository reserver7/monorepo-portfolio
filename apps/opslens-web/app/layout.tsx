import type { Metadata } from "next";
import { AppHead, appFont, createAppMetadata } from "@repo/theme";
import "./globals.css";
import { Providers } from "@/app/providers";
import { opslensClientEnv } from "@/lib/config";
import { getOpsMetadataText, resolveRequestLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveRequestLocale();
  const text = getOpsMetadataText(locale);

  return createAppMetadata({
    appName: opslensClientEnv.appTitle,
    description: text.description,
    appUrl: opslensClientEnv.appUrl,
    keywords: text.keywords,
    locale: text.ogLocale
  });
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
