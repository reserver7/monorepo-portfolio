"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastItem extends ToastInput {
  id: string;
  variant: ToastVariant;
  durationMs: number;
}

export interface ToastPromiseMessages<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
}

export interface ToastApi {
  (title: string, description?: string, durationMs?: number): string;
  show: (input: ToastInput) => string;
  success: (title: string, description?: string, durationMs?: number) => string;
  info: (title: string, description?: string, durationMs?: number) => string;
  warning: (title: string, description?: string, durationMs?: number) => string;
  error: (title: string, description?: string, durationMs?: number) => string;
  promise: <T>(
    promiseOrFactory: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages<T>
  ) => Promise<T>;
  dismiss: (id?: string) => void;
}

interface ToastState {
  items: ToastItem[];
  dismiss: (id?: string) => void;
}

const MAX_TOASTS = 3;
const MIN_DURATION_MS = 1500;
const LOADING_DURATION_MS = 60_000;

const DEFAULT_DURATION_BY_VARIANT: Record<ToastVariant, number> = {
  info: 3500,
  success: 2800,
  warning: 4600,
  error: 5200
};

type ToastStoreEvent = { type: "add"; item: ToastItem } | { type: "dismiss"; id?: string };
type ToastStoreListener = (event: ToastStoreEvent) => void;

const toastStoreListeners = new Set<ToastStoreListener>();

const subscribeToastStore = (listener: ToastStoreListener): (() => void) => {
  toastStoreListeners.add(listener);
  return () => {
    toastStoreListeners.delete(listener);
  };
};

const emitToastStoreEvent = (event: ToastStoreEvent) => {
  for (const listener of toastStoreListeners) {
    listener(event);
  }
};

const createToastId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeToastItem = (input: ToastInput): ToastItem => {
  const variant = input.variant ?? "info";
  const durationMs = Math.max(MIN_DURATION_MS, input.durationMs ?? DEFAULT_DURATION_BY_VARIANT[variant]);

  return {
    ...input,
    id: createToastId(),
    variant,
    durationMs
  };
};

const enqueueToast = (input: ToastInput): string => {
  const item = normalizeToastItem(input);
  emitToastStoreEvent({ type: "add", item });
  return item.id;
};

const broadcastDismissToast = (id?: string) => {
  emitToastStoreEvent({ type: "dismiss", id });
};

const resolvePromiseMessage = <T,>(message: string | ((value: T) => string), value: T): string => {
  if (typeof message === "function") {
    return message(value);
  }

  return message;
};

const baseToast = ((title: string, description?: string, durationMs?: number) =>
  enqueueToast({ title, description, durationMs })) as ToastApi;

baseToast.show = (input: ToastInput) => enqueueToast(input);
baseToast.success = (title: string, description?: string, durationMs?: number) =>
  enqueueToast({ title, description, durationMs, variant: "success" });
baseToast.info = (title: string, description?: string, durationMs?: number) =>
  enqueueToast({ title, description, durationMs, variant: "info" });
baseToast.warning = (title: string, description?: string, durationMs?: number) =>
  enqueueToast({ title, description, durationMs, variant: "warning" });
baseToast.error = (title: string, description?: string, durationMs?: number) =>
  enqueueToast({ title, description, durationMs, variant: "error" });
baseToast.dismiss = (id?: string) => {
  broadcastDismissToast(id);
};
baseToast.promise = async <T,>(
  promiseOrFactory: Promise<T> | (() => Promise<T>),
  messages: ToastPromiseMessages<T>
): Promise<T> => {
  const loadingToastId = enqueueToast({
    title: messages.loading,
    variant: "info",
    durationMs: LOADING_DURATION_MS
  });

  try {
    const result =
      typeof promiseOrFactory === "function" ? await promiseOrFactory() : await promiseOrFactory;
    broadcastDismissToast(loadingToastId);
    enqueueToast({
      title: resolvePromiseMessage(messages.success, result),
      variant: "success"
    });
    return result;
  } catch (error) {
    broadcastDismissToast(loadingToastId);
    enqueueToast({
      title: resolvePromiseMessage(messages.error, error),
      variant: "error"
    });
    throw error;
  }
};

export const toast: ToastApi = baseToast;

export const useToast = (): { toast: ToastApi } => {
  return { toast };
};

export const useToastState = (): ToastState => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timerMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id?: string) => {
    if (!id) {
      for (const timer of timerMapRef.current.values()) {
        clearTimeout(timer);
      }
      timerMapRef.current.clear();
      setItems([]);
      return;
    }

    const timer = timerMapRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timerMapRef.current.delete(id);
    }

    setItems((previous) => previous.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    return subscribeToastStore((event) => {
      if (event.type === "dismiss") {
        dismiss(event.id);
        return;
      }

      const nextItem = event.item;
      setItems((previous) => {
        const merged = [...previous, nextItem];
        if (merged.length <= MAX_TOASTS) {
          return merged;
        }

        const overflowCount = merged.length - MAX_TOASTS;
        const overflowItems = merged.slice(0, overflowCount);
        for (const removedItem of overflowItems) {
          const timer = timerMapRef.current.get(removedItem.id);
          if (timer) {
            clearTimeout(timer);
            timerMapRef.current.delete(removedItem.id);
          }
        }

        return merged.slice(-MAX_TOASTS);
      });

      const existingTimer = timerMapRef.current.get(nextItem.id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        dismiss(nextItem.id);
      }, nextItem.durationMs);
      timerMapRef.current.set(nextItem.id, timer);
    });
  }, [dismiss]);

  useEffect(() => {
    return () => {
      for (const timer of timerMapRef.current.values()) {
        clearTimeout(timer);
      }
      timerMapRef.current.clear();
    };
  }, []);

  return {
    items,
    dismiss
  };
};
