import { randomUUID } from "node:crypto";
import http from "node:http";
import cors from "cors";
import express, { Request } from "express";
import { Server, Socket } from "socket.io";
import type { AccessRole, EditorSnapshot, Participant, WhiteboardShape } from "@repo/shared-types";
import { serverEnv } from "./config/env";
import { EventRateLimiter } from "./security/rate-limit";
import { sanitizeEditorAccessKey, verifyEditorAccessKey } from "./security/access-key";
import { issueSessionToken, verifySessionToken } from "./security/session";
import { RealtimeStore } from "./store";

interface DocumentJoinPayload {
  documentId: string;
  sessionId?: string;
  sessionToken?: string;
  displayName?: string;
  role?: AccessRole;
  editorAccessKey?: string;
  clientYjsState?: string;
}

interface DocumentLegacyUpdatePayload {
  documentId: string;
  title?: string;
  content?: string;
  baseVersion?: number;
}

interface DocumentYjsUpdatePayload {
  documentId: string;
  encodedUpdate: string;
}

interface DocumentCommentPayload {
  documentId: string;
  body: string;
  mentions?: string[];
}

interface DocumentCommentUpdatePayload {
  documentId: string;
  commentId: string;
  body: string;
  mentions?: string[];
}

interface DocumentCommentDeletePayload {
  documentId: string;
  commentId: string;
}

interface CursorPayload {
  documentId: string;
  cursorIndex: number;
}

interface BoardJoinPayload {
  boardId: string;
  sessionId?: string;
  sessionToken?: string;
  displayName?: string;
  role?: AccessRole;
  editorAccessKey?: string;
}

interface BoardTitlePayload {
  boardId: string;
  title: string;
  baseVersion?: number;
}

interface BoardAddShapePayload {
  boardId: string;
  shape: WhiteboardShape;
  baseVersion?: number;
}

interface BoardPatchShapePayload {
  boardId: string;
  shapeId: string;
  patch: Partial<WhiteboardShape>;
  baseVersion?: number;
}

interface BoardRemoveShapePayload {
  boardId: string;
  shapeId: string;
  baseVersion?: number;
}

interface BoardCursorPayload {
  boardId: string;
  x: number;
  y: number;
}

const app = express();
const store = new RealtimeStore(serverEnv.stateFilePath);

const corsOrigins = serverEnv.allowAllCors ? true : serverEnv.corsOrigins;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    credentials: true
  }
});

const documentParticipants = new Map<string, Map<string, Participant>>();
const boardParticipants = new Map<string, Map<string, Participant>>();
const documentBySocket = new Map<string, string>();
const boardBySocket = new Map<string, string>();
const documentRolesBySession = new Map<string, Map<string, AccessRole>>();
const boardRolesBySession = new Map<string, Map<string, AccessRole>>();
const socketLimiter = new EventRateLimiter();

const documentRoom = (documentId: string): string => `document:${documentId}`;
const boardRoom = (boardId: string): string => `board:${boardId}`;

const COLORS = ["#0284c7", "#0f766e", "#16a34a", "#ca8a04", "#ea580c", "#dc2626", "#9333ea", "#4f46e5"];
const mentionPattern = /@([0-9A-Za-z가-힣._-]{2,24})/g;
const EMPTY_TITLE = "(제목 없음)";

const colorFromSession = (sessionId: string): string => {
  let hash = 0;
  for (let index = 0; index < sessionId.length; index += 1) {
    hash = (hash << 5) - hash + sessionId.charCodeAt(index);
    hash |= 0;
  }

  return COLORS[Math.abs(hash) % COLORS.length] ?? "#0284c7";
};

const sanitizeDisplayName = (raw?: string): string => {
  const value = (raw ?? "").trim();
  if (value) {
    return value.slice(0, 24);
  }

  return `Guest-${Math.floor(Math.random() * 900 + 100)}`;
};

const sanitizeRole = (rawRole?: AccessRole): AccessRole => {
  if (rawRole === "viewer") {
    return "viewer";
  }

  return "editor";
};

const trimOptional = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const enforceRateLimit = (
  socket: Socket,
  eventName: string,
  maxEventsPerWindow: number,
  windowMs = serverEnv.socketRateLimitWindowMs
): boolean => {
  const allowed = socketLimiter.allow(`${socket.id}:${eventName}`, maxEventsPerWindow, windowMs);
  if (allowed) {
    return true;
  }

  socket.emit("error", {
    message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
  });
  return false;
};

const safeJsonLength = (value: unknown): number => {
  try {
    return JSON.stringify(value).length;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
};

const rejectOversizedPayload = (socket: Socket, payload: unknown, errorMessage: string): boolean => {
  if (safeJsonLength(payload) <= serverEnv.maxSocketJsonChars) {
    return false;
  }

  socket.emit("error", { message: errorMessage });
  return true;
};

const sanitizeNonNegativeInteger = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.floor(value));
};

const resolveSessionFromSocketPayload = (
  requestedSessionId: string | undefined,
  requestedSessionToken: string | undefined
): { sessionId: string; sessionToken: string; trusted: boolean } => {
  const normalizedSessionId = trimOptional(requestedSessionId);
  const normalizedToken = trimOptional(requestedSessionToken);

  if (normalizedSessionId && normalizedToken) {
    const verification = verifySessionToken(normalizedToken, serverEnv.collabSessionSecret);
    if (verification.valid && verification.sessionId === normalizedSessionId) {
      return {
        sessionId: normalizedSessionId,
        sessionToken: issueSessionToken(normalizedSessionId, serverEnv.collabSessionSecret),
        trusted: true
      };
    }
  }

  const sessionId = randomUUID();
  return {
    sessionId,
    sessionToken: issueSessionToken(sessionId, serverEnv.collabSessionSecret),
    trusted: false
  };
};

const resolveSessionFromRequest = (
  req: Request
): { sessionId: string; sessionToken: string; trusted: boolean } => {
  const sessionIdHeader = req.header("x-collab-session-id");
  const sessionTokenHeader = req.header("x-collab-session-token");

  return resolveSessionFromSocketPayload(sessionIdHeader ?? undefined, sessionTokenHeader ?? undefined);
};

const resolveLockedRole = (
  scope: "document" | "board",
  entityId: string,
  sessionId: string,
  requestedRole: AccessRole,
  editorAccessKey?: string,
  requiredEditorAccessKey?: string
): AccessRole => {
  const roleLocks = scope === "document" ? documentRolesBySession : boardRolesBySession;

  if (!roleLocks.has(entityId)) {
    roleLocks.set(entityId, new Map());
  }

  const sessionRoles = roleLocks.get(entityId);
  if (!sessionRoles) {
    return "viewer";
  }

  const lockedRole = sessionRoles.get(sessionId);
  const effectiveEditorAccessKey =
    sanitizeEditorAccessKey(requiredEditorAccessKey) ?? sanitizeEditorAccessKey(serverEnv.editorAccessKey);

  if (lockedRole) {
    if (lockedRole === "viewer" && requestedRole === "editor") {
      const requiresEditorAccessKey = Boolean(effectiveEditorAccessKey);
      const hasValidEditorAccessKey =
        !requiresEditorAccessKey || verifyEditorAccessKey(effectiveEditorAccessKey, editorAccessKey);

      if (hasValidEditorAccessKey) {
        sessionRoles.set(sessionId, "editor");
        return "editor";
      }
    }

    return lockedRole;
  }

  let nextRole = requestedRole;
  const requiresEditorAccessKey = Boolean(effectiveEditorAccessKey);
  if (
    nextRole === "editor" &&
    requiresEditorAccessKey &&
    !verifyEditorAccessKey(effectiveEditorAccessKey, editorAccessKey)
  ) {
    nextRole = "viewer";
  }

  sessionRoles.set(sessionId, nextRole);
  return nextRole;
};

const extractMentions = (rawBody: string): string[] => {
  return Array.from(rawBody.matchAll(mentionPattern))
    .map((match) => match[1]?.trim() ?? "")
    .filter((value) => value.length > 0)
    .slice(0, 20);
};

const publicParticipant = (participant: Participant): Participant => ({
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

const editorFromParticipant = (participant?: Participant): EditorSnapshot | null => {
  if (!participant) {
    return null;
  }

  return {
    sessionId: participant.sessionId,
    displayName: participant.displayName,
    color: participant.color
  };
};

const emitPermissionDenied = (socket: Socket, scope: "document" | "board", currentRole: AccessRole) => {
  socket.emit("permission:denied", {
    scope,
    requiredRole: "editor" as AccessRole,
    currentRole
  });

  socket.emit("error", {
    message: "편집 권한(editor)이 필요한 동작입니다."
  });
};

const broadcastDocumentParticipants = (documentId: string): void => {
  const members = documentParticipants.get(documentId);
  const participants = members ? [...members.values()].map(publicParticipant) : [];

  io.to(documentRoom(documentId)).emit("participants:update", {
    documentId,
    participants
  });
};

const broadcastBoardParticipants = (boardId: string): void => {
  const members = boardParticipants.get(boardId);
  const participants = members ? [...members.values()].map(publicParticipant) : [];

  io.to(boardRoom(boardId)).emit("participants:update", {
    boardId,
    participants
  });
};

const leaveDocument = (socketId: string): void => {
  const joinedDocumentId = documentBySocket.get(socketId);
  if (!joinedDocumentId) {
    return;
  }

  const members = documentParticipants.get(joinedDocumentId);
  if (members) {
    members.delete(socketId);
    if (members.size === 0) {
      documentParticipants.delete(joinedDocumentId);
      documentRolesBySession.delete(joinedDocumentId);
    }
  }

  documentBySocket.delete(socketId);
  broadcastDocumentParticipants(joinedDocumentId);
};

const leaveBoard = (socketId: string): void => {
  const joinedBoardId = boardBySocket.get(socketId);
  if (!joinedBoardId) {
    return;
  }

  const members = boardParticipants.get(joinedBoardId);
  if (members) {
    members.delete(socketId);
    if (members.size === 0) {
      boardParticipants.delete(joinedBoardId);
      boardRolesBySession.delete(joinedBoardId);
    }
  }

  boardBySocket.delete(socketId);
  broadcastBoardParticipants(joinedBoardId);
};

const teardownDocumentAfterDelete = (documentId: string): void => {
  const members = documentParticipants.get(documentId);
  if (members) {
    for (const participant of members.values()) {
      documentBySocket.delete(participant.socketId);
      const targetSocket = io.sockets.sockets.get(participant.socketId);
      targetSocket?.leave(documentRoom(documentId));
      targetSocket?.emit("error", {
        message: "문서가 삭제되어 세션이 종료되었습니다."
      });
    }
  }

  documentParticipants.delete(documentId);
  documentRolesBySession.delete(documentId);
  broadcastDocumentParticipants(documentId);
};

const teardownBoardAfterDelete = (boardId: string): void => {
  const members = boardParticipants.get(boardId);
  if (members) {
    for (const participant of members.values()) {
      boardBySocket.delete(participant.socketId);
      const targetSocket = io.sockets.sockets.get(participant.socketId);
      targetSocket?.leave(boardRoom(boardId));
      targetSocket?.emit("error", {
        message: "화이트보드가 삭제되어 세션이 종료되었습니다."
      });
    }
  }

  boardParticipants.delete(boardId);
  boardRolesBySession.delete(boardId);
  broadcastBoardParticipants(boardId);
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get("/api/documents", (_req, res) => {
  res.json({ documents: store.listDocuments() });
});

app.post("/api/documents", (req, res) => {
  const actor = sanitizeDisplayName(req.body?.actor as string | undefined);
  const title = typeof req.body?.title === "string" ? req.body.title : EMPTY_TITLE;
  const editorAccessKey =
    typeof req.body?.editorAccessKey === "string" ? req.body.editorAccessKey : undefined;
  const created = store.createDocument(title, actor, editorAccessKey);
  res.status(201).json({ document: created });
});

app.delete("/api/documents/:id", (req, res) => {
  const editorAccessKey =
    typeof req.body?.editorAccessKey === "string" ? req.body.editorAccessKey : undefined;
  const deleted = store.deleteDocument({
    documentId: req.params.id,
    editorAccessKey
  });

  if (deleted === "not-found") {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  if (deleted === "forbidden") {
    res.status(403).json({ message: "문서 삭제 비밀번호가 올바르지 않습니다." });
    return;
  }

  teardownDocumentAfterDelete(deleted.documentId);
  res.json({ ok: true, documentId: deleted.documentId });
});

app.get("/api/documents/:id", (req, res) => {
  const document = store.getDocument(req.params.id);
  if (!document) {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  res.json({ document });
});

app.get("/api/documents/:id/history", (req, res) => {
  const document = store.getDocument(req.params.id);
  if (!document) {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  res.json({ documentId: document.id, history: store.getHistory(document.id) });
});

app.get("/api/documents/:id/comments", (req, res) => {
  const document = store.getDocument(req.params.id);
  if (!document) {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  res.json({ documentId: document.id, comments: store.listDocumentComments(document.id) });
});

app.post("/api/documents/:id/comments", (req, res) => {
  const document = store.getDocument(req.params.id);
  if (!document) {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  const session = resolveSessionFromRequest(req);
  const body = typeof req.body?.body === "string" ? req.body.body : "";
  const comment = store.addDocumentComment({
    documentId: document.id,
    authorSessionId: session.sessionId,
    authorName: sanitizeDisplayName(req.body?.authorName as string | undefined),
    body,
    mentions: Array.isArray(req.body?.mentions)
      ? req.body.mentions.filter((mention: unknown): mention is string => typeof mention === "string")
      : extractMentions(body)
  });

  if (!comment) {
    res.status(400).json({ message: "Comment body is required" });
    return;
  }

  res.status(201).json({
    documentId: document.id,
    comment,
    session: {
      id: session.sessionId,
      token: session.sessionToken,
      trusted: session.trusted
    }
  });
});

app.get("/api/boards", (_req, res) => {
  res.json({ boards: store.listBoards() });
});

app.post("/api/boards", (req, res) => {
  const actor = sanitizeDisplayName(req.body?.actor as string | undefined);
  const title = typeof req.body?.title === "string" ? req.body.title : EMPTY_TITLE;
  const editorAccessKey =
    typeof req.body?.editorAccessKey === "string" ? req.body.editorAccessKey : undefined;
  const board = store.createBoard(title, actor, editorAccessKey);
  res.status(201).json({ board });
});

app.delete("/api/boards/:id", (req, res) => {
  const editorAccessKey =
    typeof req.body?.editorAccessKey === "string" ? req.body.editorAccessKey : undefined;
  const deleted = store.deleteBoard({
    boardId: req.params.id,
    editorAccessKey
  });

  if (deleted === "not-found") {
    res.status(404).json({ message: "Board not found" });
    return;
  }

  if (deleted === "forbidden") {
    res.status(403).json({ message: "화이트보드 삭제 비밀번호가 올바르지 않습니다." });
    return;
  }

  teardownBoardAfterDelete(deleted.boardId);
  res.json({ ok: true, boardId: deleted.boardId });
});

app.get("/api/boards/:id", (req, res) => {
  const board = store.getBoard(req.params.id);
  if (!board) {
    res.status(404).json({ message: "Board not found" });
    return;
  }

  res.json({ board });
});

io.on("connection", (socket) => {
  socket.on("document:join", (payload: DocumentJoinPayload) => {
    if (!enforceRateLimit(socket, "document:join", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (!payload?.documentId) {
      socket.emit("error", { message: "documentId is required" });
      return;
    }

    const document = store.getDocument(payload.documentId);
    if (!document) {
      socket.emit("error", { message: "Document not found" });
      return;
    }

    leaveDocument(socket.id);

    const session = resolveSessionFromSocketPayload(payload.sessionId, payload.sessionToken);
    const requestedRole = sanitizeRole(payload.role);
    const requiredEditorAccessKey =
      store.getDocumentEditorAccessKey(document.id) ?? serverEnv.editorAccessKey;
    const role = resolveLockedRole(
      "document",
      document.id,
      session.sessionId,
      requestedRole,
      payload.editorAccessKey,
      requiredEditorAccessKey
    );
    const participant: Participant = {
      socketId: socket.id,
      sessionId: session.sessionId,
      displayName: sanitizeDisplayName(payload.displayName),
      color: colorFromSession(session.sessionId),
      role,
      cursorIndex: 0,
      isOnline: true,
      lastSeenAt: new Date().toISOString()
    };

    socket.join(documentRoom(document.id));

    if (!documentParticipants.has(document.id)) {
      documentParticipants.set(document.id, new Map());
    }

    documentParticipants.get(document.id)?.set(socket.id, participant);
    documentBySocket.set(socket.id, document.id);

    if (typeof payload.clientYjsState === "string" && payload.clientYjsState.length > 0) {
      if (payload.clientYjsState.length > serverEnv.maxYjsUpdateBase64Chars) {
        socket.emit("error", { message: "문서 동기화 데이터가 허용 크기를 초과했습니다." });
      } else {
        store.mergeDocumentYjsUpdate({
          documentId: document.id,
          encodedUpdate: payload.clientYjsState,
          actor: participant.displayName
        });
      }
    }

    const latestDocument = store.getDocument(document.id);
    if (!latestDocument) {
      socket.emit("error", { message: "Document not found" });
      return;
    }

    socket.emit("document:state", {
      document: latestDocument,
      role,
      comments: store.listDocumentComments(document.id),
      sessionId: session.sessionId,
      sessionToken: session.sessionToken,
      sessionTrusted: session.trusted
    });

    if (requestedRole === "editor" && role !== "editor") {
      emitPermissionDenied(socket, "document", role);
    }

    broadcastDocumentParticipants(document.id);
  });

  socket.on("document:yjs:update", (payload: DocumentYjsUpdatePayload) => {
    if (!enforceRateLimit(socket, "document:yjs:update", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
      return;
    }

    if (!payload.encodedUpdate) {
      return;
    }

    if (payload.encodedUpdate.length > serverEnv.maxYjsUpdateBase64Chars) {
      socket.emit("error", { message: "문서 업데이트 데이터가 허용 크기를 초과했습니다." });
      return;
    }

    const participant = documentParticipants.get(documentId)?.get(socket.id);
    const role = participant?.role ?? "viewer";
    if (role !== "editor") {
      emitPermissionDenied(socket, "document", role);
      return;
    }

    const result = store.mergeDocumentYjsUpdate({
      documentId,
      encodedUpdate: payload.encodedUpdate,
      actor: participant?.displayName ?? "Unknown"
    });

    if (!result || !result.changed) {
      return;
    }

    io.to(documentRoom(documentId)).emit("document:yjs:update", {
      documentId,
      encodedUpdate: payload.encodedUpdate,
      version: result.document.version,
      updatedAt: result.document.updatedAt,
      title: result.document.title,
      editor: editorFromParticipant(participant)
    });
  });

  socket.on("document:update", (payload: DocumentLegacyUpdatePayload) => {
    if (!enforceRateLimit(socket, "document:update", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const participant = documentParticipants.get(documentId)?.get(socket.id);
    const role = participant?.role ?? "viewer";
    if (role !== "editor") {
      emitPermissionDenied(socket, "document", role);
      return;
    }

    const result = store.updateDocument({
      documentId,
      title: payload.title,
      content: payload.content,
      baseVersion: payload.baseVersion,
      actor: participant?.displayName ?? "Unknown"
    });

    if (!result || !result.changed) {
      return;
    }

    io.to(documentRoom(documentId)).emit("document:update", {
      documentId: result.document.id,
      title: result.document.title,
      content: result.document.content,
      version: result.document.version,
      updatedAt: result.document.updatedAt,
      editor: editorFromParticipant(participant)
    });

    if (result.conflict) {
      socket.emit("document:conflict", {
        documentId,
        serverVersion: result.document.version,
        resolvedWith: "last-write-wins"
      });
    }
  });

  socket.on("document:comment:add", (payload: DocumentCommentPayload) => {
    if (!enforceRateLimit(socket, "document:comment:add", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const participant = documentParticipants.get(documentId)?.get(socket.id);
    const rawCommentBody = typeof payload.body === "string" ? payload.body : "";
    const comment = store.addDocumentComment({
      documentId,
      authorSessionId: participant?.sessionId ?? randomUUID(),
      authorName: participant?.displayName ?? "Unknown",
      body: rawCommentBody,
      mentions:
        Array.isArray(payload.mentions) && payload.mentions.length > 0
          ? payload.mentions
          : extractMentions(rawCommentBody)
    });

    if (!comment) {
      socket.emit("error", { message: "댓글 내용이 비어 있습니다." });
      return;
    }

    io.to(documentRoom(documentId)).emit("document:comment:add", {
      documentId,
      comment
    });
  });

  socket.on("document:comment:update", (payload: DocumentCommentUpdatePayload) => {
    if (!enforceRateLimit(socket, "document:comment:update", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const participant = documentParticipants.get(documentId)?.get(socket.id);
    const rawBody = typeof payload.body === "string" ? payload.body : "";

    const updatedComment = store.updateDocumentComment({
      documentId,
      commentId: payload.commentId,
      authorSessionId: participant?.sessionId ?? "",
      body: rawBody,
      mentions:
        Array.isArray(payload.mentions) && payload.mentions.length > 0
          ? payload.mentions
          : extractMentions(rawBody)
    });

    if (updatedComment === "forbidden") {
      socket.emit("error", { message: "댓글 작성자만 수정할 수 있습니다." });
      return;
    }

    if (!updatedComment) {
      socket.emit("error", { message: "수정할 댓글을 찾지 못했거나 내용이 비어 있습니다." });
      return;
    }

    io.to(documentRoom(documentId)).emit("document:comment:update", {
      documentId,
      comment: updatedComment
    });
  });

  socket.on("document:comment:delete", (payload: DocumentCommentDeletePayload) => {
    if (!enforceRateLimit(socket, "document:comment:delete", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const participant = documentParticipants.get(documentId)?.get(socket.id);
    const deletedCommentId = store.deleteDocumentComment({
      documentId,
      commentId: payload.commentId,
      authorSessionId: participant?.sessionId ?? ""
    });

    if (deletedCommentId === "forbidden") {
      socket.emit("error", { message: "댓글 작성자만 삭제할 수 있습니다." });
      return;
    }

    if (!deletedCommentId) {
      socket.emit("error", { message: "삭제할 댓글을 찾지 못했습니다." });
      return;
    }

    io.to(documentRoom(documentId)).emit("document:comment:delete", {
      documentId,
      commentId: deletedCommentId
    });
  });

  socket.on("cursor:move", (payload: CursorPayload) => {
    if (!enforceRateLimit(socket, "cursor:move", serverEnv.socketCursorEventsPerWindow)) {
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      return;
    }

    const participant = documentParticipants.get(documentId)?.get(socket.id);
    if (!participant) {
      return;
    }

    const sanitizedCursorIndex = sanitizeNonNegativeInteger(payload.cursorIndex);
    if (sanitizedCursorIndex === null) {
      return;
    }

    participant.cursorIndex = sanitizedCursorIndex;
    participant.lastSeenAt = new Date().toISOString();

    socket.to(documentRoom(documentId)).emit("cursor:update", {
      documentId,
      participant: publicParticipant(participant)
    });
  });

  socket.on("document:save", (payload: { documentId: string }) => {
    if (!enforceRateLimit(socket, "document:save", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const documentId = payload?.documentId;
    const joinedDocumentId = documentBySocket.get(socket.id);
    if (!joinedDocumentId || joinedDocumentId !== documentId) {
      return;
    }

    const participant = documentParticipants.get(documentId)?.get(socket.id);
    const role = participant?.role ?? "viewer";
    if (role !== "editor") {
      emitPermissionDenied(socket, "document", role);
      return;
    }

    const saved = store.markSaved(documentId, participant?.displayName ?? "Unknown");
    if (!saved) {
      return;
    }

    io.to(documentRoom(documentId)).emit("document:saved", {
      documentId,
      updatedAt: saved.updatedAt,
      version: saved.version
    });
  });

  socket.on("board:join", (payload: BoardJoinPayload) => {
    if (!enforceRateLimit(socket, "board:join", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (!payload?.boardId) {
      socket.emit("error", { message: "boardId is required" });
      return;
    }

    const board = store.getBoard(payload.boardId);
    if (!board) {
      socket.emit("error", { message: "Board not found" });
      return;
    }

    leaveBoard(socket.id);

    const session = resolveSessionFromSocketPayload(payload.sessionId, payload.sessionToken);
    const requestedRole = sanitizeRole(payload.role);
    const requiredEditorAccessKey = store.getBoardEditorAccessKey(board.id) ?? serverEnv.editorAccessKey;
    const role = resolveLockedRole(
      "board",
      board.id,
      session.sessionId,
      requestedRole,
      payload.editorAccessKey,
      requiredEditorAccessKey
    );
    const participant: Participant = {
      socketId: socket.id,
      sessionId: session.sessionId,
      displayName: sanitizeDisplayName(payload.displayName),
      color: colorFromSession(session.sessionId),
      role,
      cursorX: 0,
      cursorY: 0,
      isOnline: true,
      lastSeenAt: new Date().toISOString()
    };

    socket.join(boardRoom(board.id));

    if (!boardParticipants.has(board.id)) {
      boardParticipants.set(board.id, new Map());
    }

    boardParticipants.get(board.id)?.set(socket.id, participant);
    boardBySocket.set(socket.id, board.id);

    socket.emit("board:state", {
      board,
      role,
      sessionId: session.sessionId,
      sessionToken: session.sessionToken,
      sessionTrusted: session.trusted
    });

    if (requestedRole === "editor" && role !== "editor") {
      emitPermissionDenied(socket, "board", role);
    }

    broadcastBoardParticipants(board.id);
  });

  socket.on("board:title:update", (payload: BoardTitlePayload) => {
    if (!enforceRateLimit(socket, "board:title:update", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    const boardId = boardBySocket.get(socket.id);
    if (!boardId || payload.boardId !== boardId) {
      socket.emit("error", { message: "Join the board first" });
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const participant = boardParticipants.get(boardId)?.get(socket.id);
    const role = participant?.role ?? "viewer";
    if (role !== "editor") {
      emitPermissionDenied(socket, "board", role);
      return;
    }

    const result = store.updateBoardTitle({
      boardId,
      title: payload.title,
      baseVersion: payload.baseVersion,
      actor: participant?.displayName ?? "Unknown"
    });

    if (!result || !result.changed) {
      return;
    }

    io.to(boardRoom(boardId)).emit("board:update", {
      board: result.board,
      editor: editorFromParticipant(participant)
    });

    if (result.conflict) {
      socket.emit("board:conflict", {
        boardId,
        serverVersion: result.board.version,
        resolvedWith: "last-write-wins"
      });
    }
  });

  socket.on("board:shape:add", (payload: BoardAddShapePayload) => {
    if (!enforceRateLimit(socket, "board:shape:add", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const boardId = boardBySocket.get(socket.id);
    if (!boardId || payload.boardId !== boardId) {
      socket.emit("error", { message: "Join the board first" });
      return;
    }

    if (safeJsonLength(payload.shape) > serverEnv.maxSocketJsonChars) {
      socket.emit("error", { message: "도형 데이터가 허용 크기를 초과했습니다." });
      return;
    }

    const participant = boardParticipants.get(boardId)?.get(socket.id);
    const role = participant?.role ?? "viewer";
    if (role !== "editor") {
      emitPermissionDenied(socket, "board", role);
      return;
    }

    const result = store.addBoardShape({
      boardId,
      shape: payload.shape,
      baseVersion: payload.baseVersion,
      actor: participant?.displayName ?? "Unknown"
    });

    if (!result || !result.changed) {
      return;
    }

    io.to(boardRoom(boardId)).emit("board:update", {
      board: result.board,
      editor: editorFromParticipant(participant)
    });

    if (result.conflict) {
      socket.emit("board:conflict", {
        boardId,
        serverVersion: result.board.version,
        resolvedWith: "last-write-wins"
      });
    }
  });

  socket.on("board:shape:update", (payload: BoardPatchShapePayload) => {
    if (!enforceRateLimit(socket, "board:shape:update", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const boardId = boardBySocket.get(socket.id);
    if (!boardId || payload.boardId !== boardId) {
      socket.emit("error", { message: "Join the board first" });
      return;
    }

    if (safeJsonLength(payload.patch) > serverEnv.maxSocketJsonChars) {
      socket.emit("error", { message: "도형 수정 데이터가 허용 크기를 초과했습니다." });
      return;
    }

    const participant = boardParticipants.get(boardId)?.get(socket.id);
    const role = participant?.role ?? "viewer";
    if (role !== "editor") {
      emitPermissionDenied(socket, "board", role);
      return;
    }

    const result = store.patchBoardShape({
      boardId,
      shapeId: payload.shapeId,
      patch: payload.patch,
      baseVersion: payload.baseVersion,
      actor: participant?.displayName ?? "Unknown"
    });

    if (!result || !result.changed) {
      return;
    }

    io.to(boardRoom(boardId)).emit("board:update", {
      board: result.board,
      editor: editorFromParticipant(participant)
    });

    if (result.conflict) {
      socket.emit("board:conflict", {
        boardId,
        serverVersion: result.board.version,
        resolvedWith: "last-write-wins"
      });
    }
  });

  socket.on("board:shape:remove", (payload: BoardRemoveShapePayload) => {
    if (!enforceRateLimit(socket, "board:shape:remove", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const boardId = boardBySocket.get(socket.id);
    if (!boardId || payload.boardId !== boardId) {
      socket.emit("error", { message: "Join the board first" });
      return;
    }

    const participant = boardParticipants.get(boardId)?.get(socket.id);
    const role = participant?.role ?? "viewer";
    if (role !== "editor") {
      emitPermissionDenied(socket, "board", role);
      return;
    }

    const result = store.removeBoardShape({
      boardId,
      shapeId: payload.shapeId,
      baseVersion: payload.baseVersion,
      actor: participant?.displayName ?? "Unknown"
    });

    if (!result || !result.changed) {
      return;
    }

    io.to(boardRoom(boardId)).emit("board:update", {
      board: result.board,
      editor: editorFromParticipant(participant)
    });

    if (result.conflict) {
      socket.emit("board:conflict", {
        boardId,
        serverVersion: result.board.version,
        resolvedWith: "last-write-wins"
      });
    }
  });

  socket.on("board:cursor", (payload: BoardCursorPayload) => {
    if (!enforceRateLimit(socket, "board:cursor", serverEnv.socketCursorEventsPerWindow)) {
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const boardId = boardBySocket.get(socket.id);
    if (!boardId || payload.boardId !== boardId) {
      return;
    }

    const participant = boardParticipants.get(boardId)?.get(socket.id);
    if (!participant) {
      return;
    }

    const sanitizedCursorX = sanitizeNonNegativeInteger(payload.x);
    const sanitizedCursorY = sanitizeNonNegativeInteger(payload.y);
    if (sanitizedCursorX === null || sanitizedCursorY === null) {
      return;
    }

    participant.cursorX = sanitizedCursorX;
    participant.cursorY = sanitizedCursorY;
    participant.lastSeenAt = new Date().toISOString();

    socket.to(boardRoom(boardId)).emit("board:cursor:update", {
      boardId,
      participant: publicParticipant(participant)
    });
  });

  socket.on("board:undo", (payload: { boardId: string }) => {
    if (!enforceRateLimit(socket, "board:undo", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const boardId = payload?.boardId;
    const joinedBoardId = boardBySocket.get(socket.id);
    if (!joinedBoardId || joinedBoardId !== boardId) {
      return;
    }

    const participant = boardParticipants.get(boardId)?.get(socket.id);
    const role = participant?.role ?? "viewer";
    if (role !== "editor") {
      emitPermissionDenied(socket, "board", role);
      return;
    }

    const board = store.undoBoard(boardId);
    if (!board) {
      return;
    }

    io.to(boardRoom(boardId)).emit("board:update", {
      board,
      editor: editorFromParticipant(participant)
    });
  });

  socket.on("board:redo", (payload: { boardId: string }) => {
    if (!enforceRateLimit(socket, "board:redo", serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (rejectOversizedPayload(socket, payload, "요청 본문이 허용 크기를 초과했습니다.")) {
      return;
    }

    const boardId = payload?.boardId;
    const joinedBoardId = boardBySocket.get(socket.id);
    if (!joinedBoardId || joinedBoardId !== boardId) {
      return;
    }

    const participant = boardParticipants.get(boardId)?.get(socket.id);
    const role = participant?.role ?? "viewer";
    if (role !== "editor") {
      emitPermissionDenied(socket, "board", role);
      return;
    }

    const board = store.redoBoard(boardId);
    if (!board) {
      return;
    }

    io.to(boardRoom(boardId)).emit("board:update", {
      board,
      editor: editorFromParticipant(participant)
    });
  });

  socket.on("disconnect", () => {
    leaveDocument(socket.id);
    leaveBoard(socket.id);
    socketLimiter.resetByPrefix(`${socket.id}:`);
  });
});

const start = async (): Promise<void> => {
  await store.init();

  httpServer.listen(serverEnv.port, () => {
    console.log(`[server] running on http://localhost:${serverEnv.port}`);
  });
};

const shutdown = async (): Promise<void> => {
  await store.persistNow();
  httpServer.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

void start();
