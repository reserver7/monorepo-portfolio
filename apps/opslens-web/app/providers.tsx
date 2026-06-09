"use client";

import { useEffect, useState } from "react";
import { configureOpslensClient } from "@repo/opslens";
import { configureHttpAuth, setHttpAccessToken } from "@repo/react-query";
import { AppProviders } from "@repo/theme";
import { NextIntlClientProvider } from "next-intl";
import { OpsAlertStoreProvider } from "@/features/alerts";
import { OpsFilterStoreProvider, useOpsFilterStore } from "@/features/common/stores";
import { getAuthAccessToken } from "@/lib/auth";
import { opslensClientEnv } from "@/lib/config";
import { OPS_DEFAULT_LOCALE, type OpsLocale } from "@/lib/i18n/messages";

configureOpslensClient({ apiUrl: opslensClientEnv.apiUrl });

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
    <NextIntlClientProvider key={resolvedLocale} locale={resolvedLocale} messages={messages} timeZone="Asia/Seoul">
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

export function Providers({
  children,
  initialLocale,
  initialMessages
}: Readonly<{ children: React.ReactNode; initialLocale: OpsLocale; initialMessages: Record<string, unknown> }>) {
  return (
    <OpsFilterStoreProvider initialLocale={initialLocale}>
      <OpsI18nProvider initialMessages={initialMessages}>
        <AppProviders
          queryClientConfig={{
            defaultOptions: {
              queries: { staleTime: 15_000 }
            }
          }}
          fallbackTitle="OpsLens AI 화면에서 오류가 발생했습니다."
          fallbackDescription="잠시 후 다시 시도하거나 새로고침해 주세요."
        >
          <OpsHttpAuthBridge />
          <OpsAlertStoreProvider>
            {children}
          </OpsAlertStoreProvider>
        </AppProviders>
      </OpsI18nProvider>
    </OpsFilterStoreProvider>
  );
}
