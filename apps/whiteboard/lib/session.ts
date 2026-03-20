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
const SESSION_TOKEN_KEY = "reserver7.board.sessionToken";
const DISPLAY_NAME_KEY = "reserver7.board.displayName";
const ROLE_KEY = "reserver7.board.role";
const EDITOR_ACCESS_KEY = "reserver7.board.editorAccessKey";

const normalizeOptionalString = (value: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const createGuestName = (): string => createSharedGuestName();

export const getOrCreateSessionId = (): string => {
  return getOrCreateSharedSessionId(SESSION_KEY);
};

export const getStoredSessionToken = (): string | null => {
  return normalizeOptionalString(getStoredString(SESSION_TOKEN_KEY));
};

export const setStoredSessionIdentity = (sessionId: string, sessionToken: string): void => {
  setStoredString(SESSION_KEY, sessionId);
  setStoredString(SESSION_TOKEN_KEY, sessionToken);
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

export const getStoredEditorAccessKey = (): string | null => {
  return normalizeOptionalString(getStoredString(EDITOR_ACCESS_KEY));
};

export const setStoredEditorAccessKey = (value: string): void => {
  setStoredString(EDITOR_ACCESS_KEY, value);
};
