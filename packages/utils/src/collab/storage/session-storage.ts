import type { AccessRole } from "../types";
import {
  createGuestName as createSharedGuestName,
  getOrCreateSessionId as getOrCreateSharedSessionId,
  getStoredRole as getSharedStoredRole,
  getStoredSnapshot,
  getStoredString,
  setStoredRole as setSharedStoredRole,
  setStoredSnapshot,
  setStoredString
} from "./storage";

interface SessionStorageConfig {
  sessionKey: string;
  sessionTokenKey: string;
  displayNameKey: string;
  roleKey: string;
  editorAccessKeyKey: string;
}

interface SessionStorageWithSnapshotConfig extends SessionStorageConfig {
  snapshotPrefix: string;
}

interface SharedSessionStorage {
  createGuestName: () => string;
  getOrCreateSessionId: () => string;
  getStoredSessionToken: () => string | null;
  setStoredSessionIdentity: (sessionId: string, sessionToken: string) => void;
  getStoredDisplayName: () => string | null;
  setStoredDisplayName: (value: string) => void;
  getStoredRole: () => AccessRole | null;
  setStoredRole: (role: AccessRole) => void;
  getStoredEditorAccessKey: () => string | null;
  setStoredEditorAccessKey: (value: string) => void;
}

interface SharedSessionStorageWithSnapshot extends SharedSessionStorage {
  getStoredSnapshot: (entityId: string) => string | null;
  setStoredSnapshot: (entityId: string, encodedSnapshot: string) => void;
}

const normalizeOptionalString = (value: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

export function createSessionStorage(config: SessionStorageWithSnapshotConfig): SharedSessionStorageWithSnapshot;
export function createSessionStorage(config: SessionStorageConfig): SharedSessionStorage;
export function createSessionStorage(
  config: SessionStorageConfig | SessionStorageWithSnapshotConfig
): SharedSessionStorage | SharedSessionStorageWithSnapshot {
  const shared: SharedSessionStorage = {
    createGuestName: () => createSharedGuestName(),
    getOrCreateSessionId: () => getOrCreateSharedSessionId(config.sessionKey),
    getStoredSessionToken: () => normalizeOptionalString(getStoredString(config.sessionTokenKey)),
    setStoredSessionIdentity: (sessionId: string, sessionToken: string) => {
      setStoredString(config.sessionKey, sessionId);
      setStoredString(config.sessionTokenKey, sessionToken);
    },
    getStoredDisplayName: () => getStoredString(config.displayNameKey),
    setStoredDisplayName: (value: string) => {
      setStoredString(config.displayNameKey, value);
    },
    getStoredRole: () => getSharedStoredRole(config.roleKey),
    setStoredRole: (role: AccessRole) => {
      setSharedStoredRole(config.roleKey, role);
    },
    getStoredEditorAccessKey: () => normalizeOptionalString(getStoredString(config.editorAccessKeyKey)),
    setStoredEditorAccessKey: (value: string) => {
      setStoredString(config.editorAccessKeyKey, value);
    }
  };

  if (!("snapshotPrefix" in config)) {
    return shared;
  }

  return {
    ...shared,
    getStoredSnapshot: (entityId: string) => getStoredSnapshot(config.snapshotPrefix, entityId),
    setStoredSnapshot: (entityId: string, encodedSnapshot: string) => {
      setStoredSnapshot(config.snapshotPrefix, entityId, encodedSnapshot);
    }
  };
}
