"use client";

import { createContext, createElement, useContext, useRef, type PropsWithChildren } from "react";
import { createAppStore } from "@repo/zustand";
import { OPS_DEFAULT_LOCALE, type OpsLocale } from "@/lib/i18n/messages";

type OpsFilterState = {
  environment: "dev" | "stage" | "prod";
  locale: OpsLocale;
  serviceName: string;
  search: string;
  from?: string;
  to?: string;
  sidebarCollapsed: boolean;
  setEnvironment: (environment: OpsFilterState["environment"]) => void;
  setLocale: (locale: OpsFilterState["locale"]) => void;
  setServiceName: (serviceName: string) => void;
  setSearch: (search: string) => void;
  setRange: (from?: string, to?: string) => void;
  toggleSidebar: () => void;
};

const isOpsLocale = (value: string | null | undefined): value is OpsLocale => {
  return value === "ko" || value === "en" || value === "ja";
};

const readLocaleFromCookie = (): OpsLocale | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const localeCookie = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("opslens-locale="))
    ?.split("=")[1]
    ?.trim();

  return isOpsLocale(localeCookie) ? localeCookie : null;
};

const resolveInitialLocale = (): OpsLocale => {
  return readLocaleFromCookie() ?? OPS_DEFAULT_LOCALE;
};

const createOpsFilterStore = (initialLocale?: OpsLocale) =>
  createAppStore<OpsFilterState>(
    (set) => ({
      environment: "prod",
      locale: initialLocale ?? resolveInitialLocale(),
      serviceName: "all",
      search: "",
      from: undefined,
      to: undefined,
      sidebarCollapsed: false,
      setEnvironment: (environment) => set({ environment }),
      setLocale: (locale) => set({ locale }),
      setServiceName: (serviceName) => set({ serviceName }),
      setSearch: (search) => set({ search }),
      setRange: (from, to) => set({ from, to }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
    }),
    {
      name: "opslens-filter-store",
      persist: {
        key: "opslens-filter-store",
        partialize: (state) => ({
          environment: state.environment,
          locale: state.locale,
          serviceName: state.serviceName,
          search: state.search,
          from: state.from,
          to: state.to,
          sidebarCollapsed: state.sidebarCollapsed
        })
      }
    }
  );

type OpsFilterStore = ReturnType<typeof createOpsFilterStore>;
const OpsFilterStoreContext = createContext<OpsFilterStore | null>(null);
OpsFilterStoreContext.displayName = "OpsFilterStoreContext";

export function OpsFilterStoreProvider({
  children,
  initialLocale
}: PropsWithChildren<{ initialLocale?: OpsLocale }>) {
  const storeRef = useRef<OpsFilterStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createOpsFilterStore(initialLocale);
  }

  return createElement(OpsFilterStoreContext.Provider, { value: storeRef.current }, children);
}

export const useOpsFilterStore = <Selected,>(selector: (state: OpsFilterState) => Selected): Selected => {
  const store = useContext(OpsFilterStoreContext);
  if (!store) {
    throw new Error("OpsFilterStoreContext: Provider가 필요합니다.");
  }

  return store(selector);
};

export const useOpsFilterStoreApi = (): OpsFilterStore => {
  const store = useContext(OpsFilterStoreContext);
  if (!store) {
    throw new Error("OpsFilterStoreContext: Provider가 필요합니다.");
  }

  return store;
};
