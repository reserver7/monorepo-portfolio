import type { AccessRole } from "../types";

type BrowserWindowLike = {
  localStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
  crypto?: {
    randomUUID?: () => string;
  };
};

const getBrowserWindow = (): BrowserWindowLike | null => {
  const target = (globalThis as { window?: unknown }).window as Partial<BrowserWindowLike> | undefined;
  if (!target?.localStorage) {
    return null;
  }

  return target as BrowserWindowLike;
};

const normalizeRole = (rawValue: string | null): AccessRole | null => {
  if (rawValue === "viewer" || rawValue === "editor") {
    return rawValue;
  }

  return null;
};

export const createGuestName = (): string => `게스트-${Math.floor(100 + Math.random() * 900)}`;

export const getOrCreateSessionId = (storageKey: string): string => {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return "server-session";
  }

  const existing = browserWindow.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const created = browserWindow.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  browserWindow.localStorage.setItem(storageKey, created);
  return created;
};

export const getStoredString = (storageKey: string): string | null => {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return null;
  }

  return browserWindow.localStorage.getItem(storageKey);
};

export const setStoredString = (storageKey: string, value: string): void => {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return;
  }

  browserWindow.localStorage.setItem(storageKey, value);
};

export const getStoredRole = (storageKey: string): AccessRole | null => {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return null;
  }

  return normalizeRole(browserWindow.localStorage.getItem(storageKey));
};

export const setStoredRole = (storageKey: string, role: AccessRole): void => {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return;
  }

  browserWindow.localStorage.setItem(storageKey, role);
};

export const getStoredSnapshot = (prefix: string, entityId: string): string | null => {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return null;
  }

  return browserWindow.localStorage.getItem(`${prefix}${entityId}`);
};

export const setStoredSnapshot = (prefix: string, entityId: string, encodedSnapshot: string): void => {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return;
  }

  browserWindow.localStorage.setItem(`${prefix}${entityId}`, encodedSnapshot);
};
