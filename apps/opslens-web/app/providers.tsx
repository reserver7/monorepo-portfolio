"use client";

import { useEffect } from "react";
import { configureOpslensClient } from "@repo/opslens";
import { AppProviders } from "@repo/theme";
import { NextIntlClientProvider } from "next-intl";
import { OpsAlertStoreProvider } from "@/features/alerts";
import { OpsFilterStoreProvider, useOpsFilterStore } from "@/features/stores";
import { opslensClientEnv } from "@/lib/config";
import { OPS_DEFAULT_LOCALE, opslensMessages, type OpsLocale } from "@/lib/i18n/messages";

configureOpslensClient({ apiUrl: opslensClientEnv.apiUrl });

function OpsI18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useOpsFilterStore((state) => state.locale);
  const resolvedLocale = locale ?? OPS_DEFAULT_LOCALE;
  const messages = opslensMessages[resolvedLocale] ?? opslensMessages[OPS_DEFAULT_LOCALE];

  useEffect(() => {
    document.cookie = `opslens-locale=${resolvedLocale}; path=/; max-age=31536000; samesite=lax`;
  }, [resolvedLocale]);

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function Providers({
  children,
  initialLocale
}: Readonly<{ children: React.ReactNode; initialLocale: OpsLocale }>) {
  return (
    <OpsFilterStoreProvider initialLocale={initialLocale}>
      <OpsI18nProvider>
        <AppProviders
          queryClientConfig={{
            defaultOptions: {
              queries: { staleTime: 15_000 }
            }
          }}
          fallbackTitle="OpsLens AI 화면에서 오류가 발생했습니다."
          fallbackDescription="잠시 후 다시 시도하거나 새로고침해 주세요."
          toasterOptions={{
            position: "top-center"
          }}
        >
          <OpsAlertStoreProvider>
            {children}
          </OpsAlertStoreProvider>
        </AppProviders>
      </OpsI18nProvider>
    </OpsFilterStoreProvider>
  );
}
