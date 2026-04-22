"use client";

import { createContext, createElement, useContext, useRef, type PropsWithChildren } from "react";
import { createAppStore } from "@repo/zustand";
import type { CollabLocale } from "@/lib/i18n/messages";
import { COLLAB_DEFAULT_LOCALE } from "@/lib/i18n/messages";

type CollabLocaleState = {
  locale: CollabLocale;
  setLocale: (locale: CollabLocale) => void;
};

const isCollabLocale = (value: string | null | undefined): value is CollabLocale =>
  value === "ko" || value === "en" || value === "ja";

const readLocaleFromCookie = (): CollabLocale | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const localeCookie = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("collab-locale="))
    ?.split("=")[1]
    ?.trim();

  return isCollabLocale(localeCookie) ? localeCookie : null;
};

const resolveInitialLocale = (): CollabLocale => {
  return readLocaleFromCookie() ?? COLLAB_DEFAULT_LOCALE;
};

const createCollabLocaleStore = (initialLocale?: CollabLocale) =>
  createAppStore<CollabLocaleState>(
    (set) => ({
      locale: initialLocale ?? resolveInitialLocale(),
      setLocale: (locale) => set({ locale })
    }),
    {
      name: "collab-locale-store",
      persist: {
        key: "collab-locale-store",
        partialize: (state) => ({
          locale: state.locale
        })
      }
    }
  );

type CollabLocaleStore = ReturnType<typeof createCollabLocaleStore>;
const CollabLocaleStoreContext = createContext<CollabLocaleStore | null>(null);
CollabLocaleStoreContext.displayName = "CollabLocaleStoreContext";

export function CollabLocaleStoreProvider({
  children,
  initialLocale
}: PropsWithChildren<{ initialLocale?: CollabLocale }>) {
  const storeRef = useRef<CollabLocaleStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createCollabLocaleStore(initialLocale);
  }

  return createElement(CollabLocaleStoreContext.Provider, { value: storeRef.current }, children);
}

export const useCollabLocaleStore = <Selected,>(selector: (state: CollabLocaleState) => Selected): Selected => {
  const store = useContext(CollabLocaleStoreContext);
  if (!store) {
    throw new Error("CollabLocaleStoreContext: Provider가 필요합니다.");
  }

  return store(selector);
};

export const useCollabLocaleStoreApi = (): CollabLocaleStore => {
  const store = useContext(CollabLocaleStoreContext);
  if (!store) {
    throw new Error("CollabLocaleStoreContext: Provider가 필요합니다.");
  }

  return store;
};
