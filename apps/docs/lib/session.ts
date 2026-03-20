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
const SESSION_TOKEN_KEY = "reserver7.sessionToken";
const DISPLAY_NAME_KEY = "reserver7.displayName";
const DOCUMENT_ROLE_KEY = "reserver7.document.role";
const DOCUMENT_EDITOR_ACCESS_KEY = "reserver7.document.editorAccessKey";
const DOCUMENT_YJS_SNAPSHOT_PREFIX = "reserver7.document.yjs.";

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
  return getSharedStoredRole(DOCUMENT_ROLE_KEY);
};

export const setStoredRole = (role: AccessRole): void => {
  setSharedStoredRole(DOCUMENT_ROLE_KEY, role);
};

export const getStoredEditorAccessKey = (): string | null => {
  return normalizeOptionalString(getStoredString(DOCUMENT_EDITOR_ACCESS_KEY));
};

export const setStoredEditorAccessKey = (value: string): void => {
  setStoredString(DOCUMENT_EDITOR_ACCESS_KEY, value);
};

export const getStoredYjsSnapshot = (documentId: string): string | null => {
  return getStoredSnapshot(DOCUMENT_YJS_SNAPSHOT_PREFIX, documentId);
};

export const setStoredYjsSnapshot = (documentId: string, encodedSnapshot: string): void => {
  setStoredSnapshot(DOCUMENT_YJS_SNAPSHOT_PREFIX, documentId, encodedSnapshot);
};
