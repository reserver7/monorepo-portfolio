import type { AccessRole, EditorSnapshot, Participant, WhiteboardShape } from "@repo/shared-types";

export interface DocumentJoinPayload {
  documentId: string;
  sessionId?: string;
  sessionToken?: string;
  displayName?: string;
  role?: AccessRole;
  editorAccessKey?: string;
  clientYjsState?: string;
}

export interface DocumentLegacyUpdatePayload {
  documentId: string;
  title?: string;
  content?: string;
  baseVersion?: number;
}

export interface DocumentYjsUpdatePayload {
  documentId: string;
  encodedUpdate: string;
}

export interface DocumentCommentPayload {
  documentId: string;
  body: string;
  mentions?: string[];
}

export interface DocumentCommentUpdatePayload {
  documentId: string;
  commentId: string;
  body: string;
  mentions?: string[];
}

export interface DocumentCommentDeletePayload {
  documentId: string;
  commentId: string;
}

export interface CursorPayload {
  documentId: string;
  cursorIndex: number;
}

export interface BoardJoinPayload {
  boardId: string;
  sessionId?: string;
  sessionToken?: string;
  displayName?: string;
  role?: AccessRole;
  editorAccessKey?: string;
}

export interface BoardTitlePayload {
  boardId: string;
  title: string;
  baseVersion?: number;
}

export interface BoardAddShapePayload {
  boardId: string;
  shape: WhiteboardShape;
  baseVersion?: number;
}

export interface BoardPatchShapePayload {
  boardId: string;
  shapeId: string;
  patch: Partial<WhiteboardShape>;
  baseVersion?: number;
}

export interface BoardRemoveShapePayload {
  boardId: string;
  shapeId: string;
  baseVersion?: number;
}

export interface BoardCursorPayload {
  boardId: string;
  x: number;
  y: number;
}

const COLORS = ["#0284c7", "#0f766e", "#16a34a", "#ca8a04", "#ea580c", "#dc2626", "#9333ea", "#4f46e5"];
const mentionPattern = /@([0-9A-Za-z가-힣._-]{2,24})/g;

export const colorFromSession = (sessionId: string): string => {
  let hash = 0;
  for (let index = 0; index < sessionId.length; index += 1) {
    hash = (hash << 5) - hash + sessionId.charCodeAt(index);
    hash |= 0;
  }

  return COLORS[Math.abs(hash) % COLORS.length] ?? "#0284c7";
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
