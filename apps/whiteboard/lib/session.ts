import type { AccessRole } from "@repo/shared-types";

const SESSION_KEY = "reserver7.board.sessionId";
const DISPLAY_NAME_KEY = "reserver7.board.displayName";
const ROLE_KEY = "reserver7.board.role";

export const createGuestName = (): string => `게스트-${Math.floor(100 + Math.random() * 900)}`;

export const getOrCreateSessionId = (): string => {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const created = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
};

export const getStoredDisplayName = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(DISPLAY_NAME_KEY);
};

export const setStoredDisplayName = (value: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DISPLAY_NAME_KEY, value);
};

export const getStoredRole = (): AccessRole | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const role = window.localStorage.getItem(ROLE_KEY);
  if (role === "viewer" || role === "editor") {
    return role;
  }

  return null;
};

export const setStoredRole = (role: AccessRole): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ROLE_KEY, role);
};
