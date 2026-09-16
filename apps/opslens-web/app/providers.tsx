"use client";

import { useEffect, useState } from "react";
import { configureOpslensClient } from "@repo/opslens";
import { configureHttpAuth, setHttpAccessToken } from "@repo/react-query";
import { AppProviders } from "@repo/theme";
import { NextIntlClientProvider, useLocale, useTranslations } from "next-intl";
import { OpsAlertStoreProvider } from "@/features/alerts";
import { OpsFilterStoreProvider, useOpsFilterStore } from "@/features/common/stores";
import { getAuthAccessToken } from "@/lib/auth";
import { opslensClientEnv } from "@/lib/config";
import { OPS_DEFAULT_LOCALE, type OpsLocale } from "@/lib/i18n/messages";

configureOpslensClient({ apiUrl: opslensClientEnv.apiUrl, logTailUrl: "/api/opslens-auth/log-tail" });

const loadLocaleMessages = async (locale: OpsLocale): Promise<Record<string, unknown>> => {
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

function OpsI18nProvider({
  children,
  initialMessages
}: {
  children: React.ReactNode;
  initialMessages: Record<string, unknown>;
}) {
  const locale = useOpsFilterStore((state) => state.locale);
  const resolvedLocale = locale ?? OPS_DEFAULT_LOCALE;
  const [messages, setMessages] = useState<Record<string, unknown>>(initialMessages);

  useEffect(() => {
    document.cookie = `opslens-locale=${resolvedLocale}; path=/; max-age=31536000; samesite=lax`;
  }, [resolvedLocale]);

  useEffect(() => {
    let active = true;
    void loadLocaleMessages(resolvedLocale).then((nextMessages) => {
      if (!active) return;
      setMessages(nextMessages);
    });
    return () => {
      active = false;
    };
  }, [resolvedLocale]);

  return (
    <NextIntlClientProvider
      key={resolvedLocale}
      locale={resolvedLocale}
      messages={messages}
      timeZone="Asia/Seoul"
    >
      {children}
    </NextIntlClientProvider>
  );
}

function OpsHttpAuthBridge() {
  useEffect(() => {
    configureHttpAuth({
      getAccessToken: () => getAuthAccessToken()
    });
    setHttpAccessToken(getAuthAccessToken());
  }, []);

  return null;
}

function LocalizedAppProviders({ children }: { children: React.ReactNode }) {
  const t = useTranslations("error");
  const locale = useLocale();

  return (
    <AppProviders
      locale={locale}
      queryClientConfig={{
        defaultOptions: {
          queries: { staleTime: 15_000 }
        }
      }}
      fallbackTitle={t("loadFailedTitle")}
      fallbackDescription={t("retryDescription")}
    >
      <OpsHttpAuthBridge />
      <OpsAlertStoreProvider>{children}</OpsAlertStoreProvider>
    </AppProviders>
  );
}

export function Providers({
  children,
  initialLocale,
  initialMessages
}: Readonly<{
  children: React.ReactNode;
  initialLocale: OpsLocale;
  initialMessages: Record<string, unknown>;
}>) {
  return (
    <OpsFilterStoreProvider initialLocale={initialLocale}>
      <OpsI18nProvider initialMessages={initialMessages}>
        <LocalizedAppProviders>{children}</LocalizedAppProviders>
      </OpsI18nProvider>
    </OpsFilterStoreProvider>
  );
}
