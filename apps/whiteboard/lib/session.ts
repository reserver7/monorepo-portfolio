import type { AccessRole } from "@repo/shared-types";
import {
  createGuestName as createSharedGuestName,
  getOrCreateSessionId as getOrCreateSharedSessionId,
  getStoredRole as getSharedStoredRole,
  getStoredString,
  setStoredRole as setSharedStoredRole,
  setStoredString
} from "@repo/shared-client";

const SESSION_KEY = "reserver7.board.sessionId";
const DISPLAY_NAME_KEY = "reserver7.board.displayName";
const ROLE_KEY = "reserver7.board.role";

export const createGuestName = (): string => createSharedGuestName();

export const getOrCreateSessionId = (): string => {
  return getOrCreateSharedSessionId(SESSION_KEY);
};

export const getStoredDisplayName = (): string | null => {
  return getStoredString(DISPLAY_NAME_KEY);
};

export const setStoredDisplayName = (value: string): void => {
  setStoredString(DISPLAY_NAME_KEY, value);
};

export const getStoredRole = (): AccessRole | null => {
  return getSharedStoredRole(ROLE_KEY);
};

export const setStoredRole = (role: AccessRole): void => {
  setSharedStoredRole(ROLE_KEY, role);
};
