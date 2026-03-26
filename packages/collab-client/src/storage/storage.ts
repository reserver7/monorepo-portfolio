import type { AccessRole } from "@repo/collab-types";

const isBrowser = (): boolean => typeof window !== "undefined";

const normalizeRole = (rawValue: string | null): AccessRole | null => {
  if (rawValue === "viewer" || rawValue === "editor") {
    return rawValue;
  }

  return null;
};

export const createGuestName = (): string => `게스트-${Math.floor(100 + Math.random() * 900)}`;

export const getOrCreateSessionId = (storageKey: string): string => {
  if (!isBrowser()) {
    return "server-session";
  }

  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const created = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(storageKey, created);
  return created;
};

export const getStoredString = (storageKey: string): string | null => {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(storageKey);
};

export const setStoredString = (storageKey: string, value: string): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(storageKey, value);
};

export const getStoredRole = (storageKey: string): AccessRole | null => {
  if (!isBrowser()) {
    return null;
  }

  return normalizeRole(window.localStorage.getItem(storageKey));
};

export const setStoredRole = (storageKey: string, role: AccessRole): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(storageKey, role);
};

export const getStoredSnapshot = (prefix: string, entityId: string): string | null => {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(`${prefix}${entityId}`);
};

export const setStoredSnapshot = (prefix: string, entityId: string, encodedSnapshot: string): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(`${prefix}${entityId}`, encodedSnapshot);
};
