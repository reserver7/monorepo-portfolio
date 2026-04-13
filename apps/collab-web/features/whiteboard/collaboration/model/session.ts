import { createSessionStorage } from "@repo/utils/collab";

const sessionStorage = createSessionStorage({
  sessionKey: "reserver7.board.sessionId",
  sessionTokenKey: "reserver7.board.sessionToken",
  displayNameKey: "reserver7.board.displayName",
  roleKey: "reserver7.board.role",
  editorAccessKeyKey: "reserver7.board.editorAccessKey"
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
