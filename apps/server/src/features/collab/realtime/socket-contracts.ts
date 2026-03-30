import {
  COLLAB_PRESENCE_COLORS,
  DEFAULT_COLLAB_PRESENCE_COLOR,
  type AccessRole,
  type EditorSnapshot,
  type Participant
} from "@repo/utils/collab/server";

export { socketEventName } from "@repo/utils/collab/server";
export type {
  BoardAddShapePayload,
  BoardCursorPayload,
  BoardJoinPayload,
  BoardPatchShapePayload,
  BoardRedoPayload,
  BoardRemoveShapePayload,
  BoardTitlePayload,
  BoardUndoPayload,
  CursorPayload,
  DocumentCommentDeletePayload,
  DocumentCommentPayload,
  DocumentCommentUpdatePayload,
  DocumentJoinPayload,
  DocumentLegacyUpdatePayload,
  DocumentSavePayload,
  DocumentYjsUpdatePayload,
  SocketEventName
} from "@repo/utils/collab/server";

const mentionPattern = /@([0-9A-Za-z가-힣._-]{2,24})/g;

export const colorFromSession = (sessionId: string): string => {
  let hash = 0;
  for (let index = 0; index < sessionId.length; index += 1) {
    hash = (hash << 5) - hash + sessionId.charCodeAt(index);
    hash |= 0;
  }

  return COLLAB_PRESENCE_COLORS[Math.abs(hash) % COLLAB_PRESENCE_COLORS.length] ?? DEFAULT_COLLAB_PRESENCE_COLOR;
};

export const sanitizeDisplayName = (raw?: string): string => {
  const value = (raw ?? "").trim();
  if (value) {
    return value.slice(0, 24);
  }

  return `Guest-${Math.floor(Math.random() * 900 + 100)}`;
};

export const sanitizeRole = (rawRole?: AccessRole): AccessRole => {
  if (rawRole === "viewer") {
    return "viewer";
  }

  return "editor";
};

export const trimOptional = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

export const safeJsonLength = (value: unknown): number => {
  try {
    return JSON.stringify(value).length;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
};

export const sanitizeNonNegativeInteger = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.floor(value));
};

export const extractMentions = (rawBody: string): string[] => {
  return Array.from(rawBody.matchAll(mentionPattern))
    .map((match) => match[1]?.trim() ?? "")
    .filter((value) => value.length > 0)
    .slice(0, 20);
};

export const publicParticipant = (participant: Participant): Participant => ({
  socketId: participant.socketId,
  sessionId: participant.sessionId,
  displayName: participant.displayName,
  color: participant.color,
  role: participant.role,
  cursorIndex: participant.cursorIndex,
  cursorX: participant.cursorX,
  cursorY: participant.cursorY,
  isOnline: participant.isOnline,
  lastSeenAt: participant.lastSeenAt
});

export const editorFromParticipant = (participant?: Participant): EditorSnapshot | null => {
  if (!participant) {
    return null;
  }

  return {
    sessionId: participant.sessionId,
    displayName: participant.displayName,
    color: participant.color
  };
};
