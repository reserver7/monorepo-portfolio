import { createSessionStorage } from "@repo/utils/collab";

const sessionStorage = createSessionStorage({
  sessionKey: "reserver7.sessionId",
  sessionTokenKey: "reserver7.sessionToken",
  displayNameKey: "reserver7.displayName",
  roleKey: "reserver7.document.role",
  editorAccessKeyKey: "reserver7.document.editorAccessKey",
  snapshotPrefix: "reserver7.document.yjs."
});

export const createGuestName = sessionStorage.createGuestName;
export const getOrCreateSessionId = sessionStorage.getOrCreateSessionId;
export const getStoredSessionToken = sessionStorage.getStoredSessionToken;
export const setStoredSessionIdentity = sessionStorage.setStoredSessionIdentity;
export const getStoredDisplayName = sessionStorage.getStoredDisplayName;
export const setStoredDisplayName = sessionStorage.setStoredDisplayName;
export const getStoredRole = sessionStorage.getStoredRole;
export const setStoredRole = sessionStorage.setStoredRole;
export const getStoredEditorAccessKey = sessionStorage.getStoredEditorAccessKey;
export const setStoredEditorAccessKey = sessionStorage.setStoredEditorAccessKey;
export const getStoredYjsSnapshot = sessionStorage.getStoredSnapshot;
export const setStoredYjsSnapshot = sessionStorage.setStoredSnapshot;
