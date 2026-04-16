"use client";

import { createAppStore, createScopedStoreProvider } from "@repo/zustand";

type OpsFilterState = {
  environment: "dev" | "stage" | "prod";
  serviceName: string;
  search: string;
  from?: string;
  to?: string;
  sidebarCollapsed: boolean;
  setEnvironment: (environment: OpsFilterState["environment"]) => void;
  setServiceName: (serviceName: string) => void;
  setSearch: (search: string) => void;
  setRange: (from?: string, to?: string) => void;
  toggleSidebar: () => void;
};

const createOpsFilterStore = () =>
  createAppStore<OpsFilterState>(
    (set) => ({
      environment: "prod",
      serviceName: "all",
      search: "",
      from: undefined,
      to: undefined,
      sidebarCollapsed: false,
      setEnvironment: (environment) => set({ environment }),
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
          serviceName: state.serviceName,
          search: state.search,
          from: state.from,
          to: state.to,
          sidebarCollapsed: state.sidebarCollapsed
        })
      }
    }
  );

const scopedOpsFilterStore = createScopedStoreProvider(createOpsFilterStore, {
  displayName: "OpsFilterStoreContext"
});

export const OpsFilterStoreProvider = scopedOpsFilterStore.Provider;
export const useOpsFilterStore = scopedOpsFilterStore.useScopedStore;
export const useOpsFilterStoreApi = scopedOpsFilterStore.useScopedStoreApi;
