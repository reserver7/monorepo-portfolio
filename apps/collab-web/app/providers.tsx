"use client";

import { useEffect } from "react";
import { AppProviders } from "@repo/theme";
import { NextIntlClientProvider } from "next-intl";
import { COLLAB_DEFAULT_LOCALE, collabMessages, type CollabLocale } from "@/lib/i18n/messages";
import { CollabLocaleStoreProvider, useCollabLocaleStore } from "@/features/stores";

function CollabI18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useCollabLocaleStore((state) => state.locale);
  const resolvedLocale = locale ?? COLLAB_DEFAULT_LOCALE;
  const messages = collabMessages[resolvedLocale] ?? collabMessages[COLLAB_DEFAULT_LOCALE];

  useEffect(() => {
    document.cookie = `collab-locale=${resolvedLocale}; path=/; max-age=31536000; samesite=lax`;
  }, [resolvedLocale]);

  return <NextIntlClientProvider locale={resolvedLocale} messages={messages}>{children}</NextIntlClientProvider>;
}

export function Providers({
  children,
  initialLocale
}: Readonly<{ children: React.ReactNode; initialLocale: CollabLocale }>) {
  return (
    <CollabLocaleStoreProvider initialLocale={initialLocale}>
      <CollabI18nProvider>
        <AppProviders
          queryClientConfig={{
            defaultOptions: {
              queries: { retry: 1 }
            }
          }}
          fallbackTitle="문서 화면에서 오류가 발생했습니다."
          fallbackDescription="잠시 후 다시 시도하거나 새로고침해 주세요."
        >
          {children}
        </AppProviders>
      </CollabI18nProvider>
    </CollabLocaleStoreProvider>
  );
}
