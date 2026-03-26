"use client";

import { create } from "zustand";

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

export const useOpsFilterStore = create<OpsFilterState>((set) => ({
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
}));
