import type { AccessRole } from "@repo/shared-types";
import {
  createGuestName as createSharedGuestName,
  getOrCreateSessionId as getOrCreateSharedSessionId,
  getStoredRole as getSharedStoredRole,
  getStoredSnapshot,
  getStoredString,
  setStoredRole as setSharedStoredRole,
  setStoredSnapshot,
  setStoredString
} from "@repo/shared-client";

const SESSION_KEY = "reserver7.sessionId";
const DISPLAY_NAME_KEY = "reserver7.displayName";
const DOCUMENT_ROLE_KEY = "reserver7.document.role";
const DOCUMENT_YJS_SNAPSHOT_PREFIX = "reserver7.document.yjs.";

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
  return getSharedStoredRole(DOCUMENT_ROLE_KEY);
};

export const setStoredRole = (role: AccessRole): void => {
  setSharedStoredRole(DOCUMENT_ROLE_KEY, role);
};

export const getStoredYjsSnapshot = (documentId: string): string | null => {
  return getStoredSnapshot(DOCUMENT_YJS_SNAPSHOT_PREFIX, documentId);
};

export const setStoredYjsSnapshot = (documentId: string, encodedSnapshot: string): void => {
  setStoredSnapshot(DOCUMENT_YJS_SNAPSHOT_PREFIX, documentId, encodedSnapshot);
};
