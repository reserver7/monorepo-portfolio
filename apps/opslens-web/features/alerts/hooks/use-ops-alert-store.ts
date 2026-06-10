"use client";

import { createAppStore, createScopedStoreProvider } from "@repo/zustand";
import { OPS_ALERT_STORE_KEY } from "../constants";
import type { CreateOpsAlertInput, OpsAlert } from "../types";
import { createOpsAlertId, createOpsAlertSeedItems, getOpsAlertTimestamp } from "../utils/alerts-utils";

type OpsAlertState = {
  alerts: OpsAlert[];
  addAlert: (input: CreateOpsAlertInput) => string;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  markAllRead: () => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
  replaceAlerts: (alerts: OpsAlert[]) => void;
};

const createOpsAlertStore = () =>
  createAppStore<OpsAlertState>(
    (set) => ({
      alerts: createOpsAlertSeedItems(),
      addAlert: (input) => {
        const id = createOpsAlertId();
        const nextAlert: OpsAlert = {
          id,
          title: input.title,
          message: input.message,
          level: input.level ?? "info",
          source: input.source,
          link: input.link,
          createdAt: input.createdAt ?? getOpsAlertTimestamp()
        };
        set((state) => ({
          alerts: [nextAlert, ...state.alerts].slice(0, 50)
        }));
        return id;
      },
      markRead: (id) => {
        const stamp = getOpsAlertTimestamp();
        set((state) => ({
          alerts: state.alerts.map((alert) => (alert.id === id ? { ...alert, readAt: alert.readAt ?? stamp } : alert))
        }));
      },
      markUnread: (id) => {
        set((state) => ({
          alerts: state.alerts.map((alert) => (alert.id === id ? { ...alert, readAt: undefined } : alert))
        }));
      },
      markAllRead: () => {
        const stamp = getOpsAlertTimestamp();
        set((state) => ({
          alerts: state.alerts.map((alert) => ({ ...alert, readAt: alert.readAt ?? stamp }))
        }));
      },
      removeAlert: (id) => {
        set((state) => ({ alerts: state.alerts.filter((alert) => alert.id !== id) }));
      },
      clearAlerts: () => {
        set({ alerts: [] });
      },
      replaceAlerts: (alerts) => {
        set({ alerts });
      }
    }),
    {
      name: OPS_ALERT_STORE_KEY,
      persist: {
        key: OPS_ALERT_STORE_KEY,
        partialize: (state) => ({ alerts: state.alerts })
      }
    }
  );

const scopedOpsAlertStore = createScopedStoreProvider(createOpsAlertStore, {
  displayName: "OpsAlertStoreContext"
});

export const OpsAlertStoreProvider = scopedOpsAlertStore.Provider;
export const useOpsAlertStore = scopedOpsAlertStore.useScopedStore;
export const useOpsAlertStoreApi = scopedOpsAlertStore.useScopedStoreApi;
