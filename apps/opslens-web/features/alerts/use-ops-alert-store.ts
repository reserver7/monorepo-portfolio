"use client";

import { createAppStore, createScopedStoreProvider } from "@repo/zustand";
import type { CreateOpsAlertInput, OpsAlert } from "./types";

type OpsAlertState = {
  alerts: OpsAlert[];
  addAlert: (input: CreateOpsAlertInput) => string;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  markAllRead: () => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
};

const SEED_ALERTS: OpsAlert[] = [
  {
    id: "seed-alert-1",
    title: "결제 승인 단계 TypeError 급증",
    level: "critical",
    source: "payments-api",
    createdAt: new Date(Date.now() - 2 * 60_000).toISOString()
  },
  {
    id: "seed-alert-2",
    title: "주문 상세 API 500 에러 재발",
    level: "high",
    source: "orders-api",
    createdAt: new Date(Date.now() - 7 * 60_000).toISOString(),
    readAt: new Date(Date.now() - 4 * 60_000).toISOString()
  }
];

const nowIso = () => new Date().toISOString();

const createOpsAlertStore = () =>
  createAppStore<OpsAlertState>(
    (set) => ({
      alerts: SEED_ALERTS,
      addAlert: (input) => {
        const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const nextAlert: OpsAlert = {
          id,
          title: input.title,
          message: input.message,
          level: input.level ?? "info",
          source: input.source,
          link: input.link,
          createdAt: input.createdAt ?? nowIso()
        };
        set((state) => ({
          alerts: [nextAlert, ...state.alerts].slice(0, 50)
        }));
        return id;
      },
      markRead: (id) => {
        const stamp = nowIso();
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
        const stamp = nowIso();
        set((state) => ({
          alerts: state.alerts.map((alert) => ({ ...alert, readAt: alert.readAt ?? stamp }))
        }));
      },
      removeAlert: (id) => {
        set((state) => ({ alerts: state.alerts.filter((alert) => alert.id !== id) }));
      },
      clearAlerts: () => {
        set({ alerts: [] });
      }
    }),
    {
      name: "opslens-alert-store",
      persist: {
        key: "opslens-alert-store",
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
