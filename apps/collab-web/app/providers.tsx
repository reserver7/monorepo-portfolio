"use client";

import { useEffect, useState } from "react";
import { AppProviders } from "@repo/theme";
import { NextIntlClientProvider, useLocale, useTranslations } from "next-intl";
import { COLLAB_DEFAULT_LOCALE, type CollabLocale } from "@/lib/i18n/messages";
import { CollabLocaleStoreProvider, useCollabLocaleStore } from "@/features/stores";

const loadLocaleMessages = async (locale: CollabLocale): Promise<Record<string, unknown>> => {
  if (locale === "en") {
    const mod = await import("@/lib/i18n/messages/en.json");
    return mod.default as Record<string, unknown>;
  }
  if (locale === "ja") {
    const mod = await import("@/lib/i18n/messages/ja.json");
    return mod.default as Record<string, unknown>;
  }
  const mod = await import("@/lib/i18n/messages/ko.json");
  return mod.default as Record<string, unknown>;
};

function CollabI18nProvider({
  children,
  initialMessages
}: {
  children: React.ReactNode;
  initialMessages: Record<string, unknown>;
}) {
  const locale = useCollabLocaleStore((state) => state.locale);
  const resolvedLocale = locale ?? COLLAB_DEFAULT_LOCALE;
  const [messages, setMessages] = useState<Record<string, unknown>>(initialMessages);

  useEffect(() => {
    document.cookie = `collab-locale=${resolvedLocale}; path=/; max-age=31536000; samesite=lax`;
  }, [resolvedLocale]);

  useEffect(() => {
    let active = true;
    void loadLocaleMessages(resolvedLocale).then((nextMessages) => {
      if (active) setMessages(nextMessages);
    });
    return () => {
      active = false;
    };
  }, [resolvedLocale]);

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={messages} timeZone="Asia/Seoul">
      {children}
    </NextIntlClientProvider>
  );
}

function LocalizedAppProviders({ children }: { children: React.ReactNode }) {
  const t = useTranslations("error");
  const locale = useLocale();

  return (
    <AppProviders
      locale={locale}
      queryClientConfig={{
        defaultOptions: {
          queries: { retry: 1 }
        }
      }}
      fallbackTitle={t("fallbackTitle")}
      fallbackDescription={t("fallbackDescription")}
    >
      {children}
    </AppProviders>
  );
}

export function Providers({
  children,
  initialLocale,
  initialMessages
}: Readonly<{
  children: React.ReactNode;
  initialLocale: CollabLocale;
  initialMessages: Record<string, unknown>;
}>) {
  return (
    <CollabLocaleStoreProvider initialLocale={initialLocale}>
      <CollabI18nProvider initialMessages={initialMessages}>
        <LocalizedAppProviders>{children}</LocalizedAppProviders>
      </CollabI18nProvider>
    </CollabLocaleStoreProvider>
  );
}
