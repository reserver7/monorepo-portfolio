import { randomUUID } from "node:crypto";
import http from "node:http";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { Server, Socket } from "socket.io";
import type { AccessRole, Participant } from "../../../packages/utils/src/collab";
import { serverEnv } from "./config";
import {
  createLogger,
  getRequestId,
  requestObservabilityMiddleware,
  SocketEventMetrics
} from "./observability";
import {
  BoardAddShapePayload,
  BoardCursorPayload,
  BoardJoinPayload,
  BoardPatchShapePayload,
  BoardRedoPayload,
  BoardRemoveShapePayload,
  BoardTitlePayload,
  BoardUndoPayload,
  boardRoom,
  colorFromSession,
  createRealtimeSessionState,
  CursorPayload,
  DocumentCommentDeletePayload,
  DocumentCommentPayload,
  DocumentCommentUpdatePayload,
  DocumentJoinPayload,
  DocumentLegacyUpdatePayload,
  documentRoom,
  DocumentSavePayload,
  DocumentYjsUpdatePayload,
  editorFromParticipant,
  extractMentions,
  publicParticipant,
  safeJsonLength,
  sanitizeDisplayName,
  sanitizeNonNegativeInteger,
  sanitizeRole,
  SocketEventName,
  socketEventName,
  trimOptional
} from "./features/workspace";
import {
  API_ROUTES,
  EventRateLimiter,
  issueSessionToken,
  readOptionalString,
  readStringArray,
  RealtimeStore,
  PostgresStatePersistence,
  configureRedisRealtimeAdapter,
  MemoryRoleLockStore,
  type RealtimeAdapterHandle,
  type RoleLockStore,
  sanitizeEditorAccessKey,
  toJsonObject,
  verifyEditorAccessKey,
  verifySessionToken,
  extractAccountFromAuthorization,
  extractAccountFromRealtimeToken,
  issueAccountRealtimeToken,
  type AccountIdentity,
  canEditWorkspace,
  canManageWorkspace,
  canReadWorkspace,
  resolveWorkspacePermission,
  normalizeWorkspaceMemberEmail
} from "./features/workspace";

const app = express();
const store = new RealtimeStore(
  serverEnv.stateBackend === "postgres"
    ? new PostgresStatePersistence(serverEnv.collabDatabaseUrl!)
    : serverEnv.stateFilePath
);
const logger = createLogger({
  service: "collab-server",
  env: serverEnv.nodeEnv
});
const httpLogger = logger.child({ component: "http" });
const socketLogger = logger.child({ component: "socket" });
const socketMetrics = new SocketEventMetrics(logger.child({ component: "socket.metrics" }));

const corsOrigins = serverEnv.allowAllCors ? true : serverEnv.corsOrigins;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
);
app.use(requestObservabilityMiddleware(httpLogger));
app.use(express.json({ limit: "2mb" }));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    credentials: true
  }
});
let realtimeAdapterHandle: RealtimeAdapterHandle | null = null;

const { boardBySocket, boardParticipants, documentBySocket, documentParticipants } =
  createRealtimeSessionState();
const socketLimiter = new EventRateLimiter();
let roleLockStore: RoleLockStore = new MemoryRoleLockStore();
const EMPTY_TITLE = "(제목 없음)";

const enforceRateLimit = (
  socket: Socket,
  eventName: SocketEventName,
  maxEventsPerWindow: number,
  windowMs = serverEnv.socketRateLimitWindowMs
): boolean => {
  const allowed = socketLimiter.allow(`${socket.id}:${eventName}`, maxEventsPerWindow, windowMs);
  if (allowed) {
    return true;
  }

  socketMetrics.record(eventName, "rateLimited");
  socketLogger.warn("socket.rate_limited", {
    socketId: socket.id,
    eventName,
    maxEventsPerWindow,
    windowMs
  });
  socket.emit("error", {
    message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
  });
  return false;
};

const rejectOversizedPayload = (
  socket: Socket,
  eventName: SocketEventName,
  payload: unknown,
  errorMessage: string
): boolean => {
  if (safeJsonLength(payload) <= serverEnv.maxSocketJsonChars) {
    return false;
  }

  socketMetrics.record(eventName, "payloadRejected");
  socketLogger.warn("socket.payload_rejected", {
    socketId: socket.id,
    eventName,
    payloadBytes: safeJsonLength(payload),
    maxSocketJsonChars: serverEnv.maxSocketJsonChars
  });
  socket.emit("error", { message: errorMessage });
  return true;
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

const resolveAccountFromRequest = (req: Request, res: Response): AccountIdentity | null | undefined => {
  const account = extractAccountFromAuthorization(req.header("authorization"), serverEnv.authBridgeSecret);
  const testBypass = process.env.COLLAB_E2E_AUTH_BYPASS === "true" && serverEnv.nodeEnv !== "production";
  if (serverEnv.authBridgeSecret && !account && !testBypass) {
    res.status(401).json({ message: "유효한 계정 세션이 필요합니다." });
    return undefined;
  }
  return account;
};

const resolveWorkspaceRequest = (
  req: Request,
  res: Response,
  kind: "document" | "board",
  entityId: string,
  required: "read" | "edit" | "manage" = "read"
):
  | { account: AccountIdentity | null; permission: ReturnType<typeof resolveWorkspacePermission> }
  | undefined => {
  const account = resolveAccountFromRequest(req, res);
  if (account === undefined) return undefined;
  const record = kind === "document" ? store.getDocument(entityId) : store.getBoard(entityId);
  if (!record) {
    res.status(404).json({ message: kind === "document" ? "Document not found" : "Board not found" });
    return undefined;
  }

  const permission = resolveWorkspacePermission(record, account);
  const allowed =
    required === "manage"
      ? canManageWorkspace(permission)
      : required === "edit"
        ? canEditWorkspace(permission)
        : canReadWorkspace(permission);
  if (!allowed) {
    res
      .status(account ? 403 : 401)
      .json({ message: account ? "작업 공간 접근 권한이 없습니다." : "유효한 계정 세션이 필요합니다." });
    return undefined;
  }
  return { account, permission };
};

const readWorkspaceMemberInput = (body: Record<string, unknown>) => ({
  email: normalizeWorkspaceMemberEmail(typeof body.email === "string" ? body.email : ""),
  role: body.role === "editor" ? ("editor" as const) : ("viewer" as const)
});

const resolveLockedRole = async (
  scope: "document" | "board",
  entityId: string,
  sessionId: string,
  requestedRole: AccessRole,
  editorAccessKey?: string,
  requiredEditorAccessKey?: string
): Promise<AccessRole> => {
  const lockedRole = await roleLockStore.get(scope, entityId, sessionId);
  const effectiveEditorAccessKey =
    sanitizeEditorAccessKey(requiredEditorAccessKey) ?? sanitizeEditorAccessKey(serverEnv.editorAccessKey);

  if (lockedRole) {
    if (lockedRole === "viewer" && requestedRole === "editor") {
      const requiresEditorAccessKey = Boolean(effectiveEditorAccessKey);
      const hasValidEditorAccessKey =
        !requiresEditorAccessKey || verifyEditorAccessKey(effectiveEditorAccessKey, editorAccessKey);

      if (hasValidEditorAccessKey) {
        await roleLockStore.set(scope, entityId, sessionId, "editor");
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

  await roleLockStore.set(scope, entityId, sessionId, nextRole);
  return nextRole;
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

const broadcastDocumentParticipants = async (documentId: string): Promise<void> => {
  const sockets = await io.in(documentRoom(documentId)).fetchSockets();
  const participants = sockets
    .map((remoteSocket) => remoteSocket.data.documentParticipant as Participant | undefined)
    .filter((participant): participant is Participant => Boolean(participant))
    .map(publicParticipant);

  io.to(documentRoom(documentId)).emit("participants:update", {
    documentId,
    participants
  });
};

const broadcastBoardParticipants = async (boardId: string): Promise<void> => {
  const sockets = await io.in(boardRoom(boardId)).fetchSockets();
  const participants = sockets
    .map((remoteSocket) => remoteSocket.data.boardParticipant as Participant | undefined)
    .filter((participant): participant is Participant => Boolean(participant))
    .map(publicParticipant);

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
    }
  }

  documentBySocket.delete(socketId);
  const targetSocket = io.sockets.sockets.get(socketId);
  if (targetSocket) delete targetSocket.data.documentParticipant;
  void broadcastDocumentParticipants(joinedDocumentId);
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
    }
  }

  boardBySocket.delete(socketId);
  const targetSocket = io.sockets.sockets.get(socketId);
  if (targetSocket) delete targetSocket.data.boardParticipant;
  void broadcastBoardParticipants(joinedBoardId);
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
  void roleLockStore.deleteScope("document", documentId);
  void broadcastDocumentParticipants(documentId);
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
  void roleLockStore.deleteScope("board", boardId);
  void broadcastBoardParticipants(boardId);
};

app.get(API_ROUTES.health, (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.post(API_ROUTES.realtimeToken, (req, res) => {
  const account = resolveAccountFromRequest(req, res);
  if (!account) return;
  res.json({ token: issueAccountRealtimeToken(account, serverEnv.collabSessionSecret) });
});

app.get(API_ROUTES.documents, (req, res) => {
  const account = resolveAccountFromRequest(req, res);
  if (account === undefined) return;
  res.json({ documents: store.listDocuments(account?.id, account?.email) });
});

app.post(API_ROUTES.documents, (req, res) => {
  const account = resolveAccountFromRequest(req, res);
  if (account === undefined) return;
  const body = toJsonObject(req.body);
  const actor = sanitizeDisplayName(readOptionalString(body, "actor"));
  const title = readOptionalString(body, "title") ?? EMPTY_TITLE;
  const editorAccessKey = readOptionalString(body, "editorAccessKey");
  const created = store.createDocument(title, actor, editorAccessKey, account?.id);
  res.status(201).json({ document: created });
});

app.delete(API_ROUTES.documentById, (req, res) => {
  const account = resolveAccountFromRequest(req, res);
  if (account === undefined) return;
  const body = toJsonObject(req.body);
  const editorAccessKey = readOptionalString(body, "editorAccessKey");
  const deleted = store.deleteDocument({
    documentId: req.params.id,
    editorAccessKey,
    ownerId: account?.id
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

app.get(API_ROUTES.documentById, (req, res) => {
  const access = resolveWorkspaceRequest(req, res, "document", req.params.id);
  if (!access) return;
  const document = store.getDocument(req.params.id);
  if (!document) return;

  res.json({ document, permission: access.permission });
});

app.get(API_ROUTES.documentHistory, (req, res) => {
  const access = resolveWorkspaceRequest(req, res, "document", req.params.id);
  if (!access) return;
  const document = store.getDocument(req.params.id);
  if (!document) {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  res.json({ documentId: document.id, history: store.getHistory(document.id) });
});

app.get(API_ROUTES.documentComments, (req, res) => {
  const access = resolveWorkspaceRequest(req, res, "document", req.params.id);
  if (!access) return;
  const document = store.getDocument(req.params.id);
  if (!document) {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  res.json({ documentId: document.id, comments: store.listDocumentComments(document.id) });
});

app.post(API_ROUTES.documentComments, (req, res) => {
  const access = resolveWorkspaceRequest(req, res, "document", req.params.id);
  if (!access) return;
  const document = store.getDocument(req.params.id);
  if (!document) {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  const bodyPayload = toJsonObject(req.body);
  const session = resolveSessionFromRequest(req);
  const body = readOptionalString(bodyPayload, "body") ?? "";
  const mentions = readStringArray(bodyPayload, "mentions");
  const comment = store.addDocumentComment({
    documentId: document.id,
    authorSessionId: session.sessionId,
    authorName: sanitizeDisplayName(readOptionalString(bodyPayload, "authorName")),
    body,
    mentions: mentions.length > 0 ? mentions : extractMentions(body)
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

app.get(API_ROUTES.documentMembers, (req, res) => {
  const access = resolveWorkspaceRequest(req, res, "document", req.params.id);
  if (!access) return;
  res.json({ members: store.listWorkspaceMembers("document", req.params.id) ?? [] });
});

app.post(API_ROUTES.documentMembers, (req, res) => {
  const access = resolveWorkspaceRequest(req, res, "document", req.params.id, "manage");
  if (!access?.account) return;
  const input = readWorkspaceMemberInput(toJsonObject(req.body));
  if (!input.email || input.email === access.account.email.trim().toLowerCase()) {
    res.status(400).json({ message: "유효한 초대 이메일이 필요합니다." });
    return;
  }
  const member = store.upsertWorkspaceMember({
    kind: "document",
    entityId: req.params.id,
    ownerId: access.account.id,
    ...input
  });
  if (member === "invalid") {
    res.status(400).json({ message: "유효한 멤버 정보가 필요합니다." });
    return;
  }
  res.status(201).json({ member });
});

app.delete(API_ROUTES.documentMembers, (req, res) => {
  const access = resolveWorkspaceRequest(req, res, "document", req.params.id, "manage");
  if (!access?.account) return;
  const email = typeof req.query.email === "string" ? req.query.email : "";
  const member = store.removeWorkspaceMember({
    kind: "document",
    entityId: req.params.id,
    ownerId: access.account.id,
    email
  });
  if (member === "member-not-found") {
    res.status(404).json({ message: "멤버를 찾을 수 없습니다." });
    return;
  }
  res.json({ member });
});

app.get(API_ROUTES.boards, (req, res) => {
  const account = resolveAccountFromRequest(req, res);
  if (account === undefined) return;
  res.json({ boards: store.listBoards(account?.id, account?.email) });
});

app.post(API_ROUTES.boards, (req, res) => {
  const account = resolveAccountFromRequest(req, res);
  if (account === undefined) return;
  const body = toJsonObject(req.body);
  const actor = sanitizeDisplayName(readOptionalString(body, "actor"));
  const title = readOptionalString(body, "title") ?? EMPTY_TITLE;
  const editorAccessKey = readOptionalString(body, "editorAccessKey");
  const board = store.createBoard(title, actor, editorAccessKey, account?.id);
  res.status(201).json({ board });
});

app.delete(API_ROUTES.boardById, (req, res) => {
  const account = resolveAccountFromRequest(req, res);
  if (account === undefined) return;
  const body = toJsonObject(req.body);
  const editorAccessKey = readOptionalString(body, "editorAccessKey");
  const deleted = store.deleteBoard({
    boardId: req.params.id,
    editorAccessKey,
    ownerId: account?.id
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

app.get(API_ROUTES.boardById, (req, res) => {
  const access = resolveWorkspaceRequest(req, res, "board", req.params.id);
  if (!access) return;
  const board = store.getBoard(req.params.id);
  if (!board) return;

  res.json({ board, permission: access.permission });
});

app.get(API_ROUTES.boardMembers, (req, res) => {
  const access = resolveWorkspaceRequest(req, res, "board", req.params.id);
  if (!access) return;
  res.json({ members: store.listWorkspaceMembers("board", req.params.id) ?? [] });
});

app.post(API_ROUTES.boardMembers, (req, res) => {
  const access = resolveWorkspaceRequest(req, res, "board", req.params.id, "manage");
  if (!access?.account) return;
  const input = readWorkspaceMemberInput(toJsonObject(req.body));
  if (!input.email || input.email === access.account.email.trim().toLowerCase()) {
    res.status(400).json({ message: "유효한 초대 이메일이 필요합니다." });
    return;
  }
  const member = store.upsertWorkspaceMember({
    kind: "board",
    entityId: req.params.id,
    ownerId: access.account.id,
    ...input
  });
  if (member === "invalid") {
    res.status(400).json({ message: "유효한 멤버 정보가 필요합니다." });
    return;
  }
  res.status(201).json({ member });
});

app.delete(API_ROUTES.boardMembers, (req, res) => {
  const access = resolveWorkspaceRequest(req, res, "board", req.params.id, "manage");
  if (!access?.account) return;
  const email = typeof req.query.email === "string" ? req.query.email : "";
  const member = store.removeWorkspaceMember({
    kind: "board",
    entityId: req.params.id,
    ownerId: access.account.id,
    email
  });
  if (member === "member-not-found") {
    res.status(404).json({ message: "멤버를 찾을 수 없습니다." });
    return;
  }
  res.json({ member });
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  httpLogger.error("http.request.error", {
    requestId: getRequestId(req),
    method: req.method,
    path: req.originalUrl || req.url,
    error: error instanceof Error ? error.message : String(error)
  });

  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).json({ message: "Internal server error" });
});

io.on("connection", (socket) => {
  socketLogger.info("socket.connected", {
    socketId: socket.id
  });

  socket.on(socketEventName.documentJoin, async (payload: DocumentJoinPayload) => {
    socketMetrics.record(socketEventName.documentJoin, "received");

    if (!enforceRateLimit(socket, socketEventName.documentJoin, serverEnv.socketWriteEventsPerWindow)) {
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

    const account = extractAccountFromRealtimeToken(payload.accountToken, serverEnv.collabSessionSecret);
    const permission = resolveWorkspacePermission(document, account);
    if (document.ownerId && !canReadWorkspace(permission)) {
      socket.emit("error", { message: "작업 공간 접근 권한이 없습니다." });
      return;
    }

    leaveDocument(socket.id);

    const session = resolveSessionFromSocketPayload(payload.sessionId, payload.sessionToken);
    const requestedRole = permission === "viewer" ? "viewer" : sanitizeRole(payload.role);
    const requiredEditorAccessKey =
      permission === "legacy"
        ? (store.getDocumentEditorAccessKey(document.id) ?? serverEnv.editorAccessKey)
        : undefined;
    const role =
      permission === "owner" || permission === "editor"
        ? requestedRole
        : await resolveLockedRole(
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
    socket.data.documentParticipant = participant;

    if (
      role === "editor" &&
      typeof payload.clientYjsState === "string" &&
      payload.clientYjsState.length > 0
    ) {
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

    void broadcastDocumentParticipants(document.id);
  });

  socket.on(socketEventName.documentYjsUpdate, (payload: DocumentYjsUpdatePayload) => {
    socketMetrics.record(socketEventName.documentYjsUpdate, "received");

    if (!enforceRateLimit(socket, socketEventName.documentYjsUpdate, serverEnv.socketWriteEventsPerWindow)) {
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

  socket.on(socketEventName.documentUpdate, (payload: DocumentLegacyUpdatePayload) => {
    socketMetrics.record(socketEventName.documentUpdate, "received");

    if (!enforceRateLimit(socket, socketEventName.documentUpdate, serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.documentUpdate,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

  socket.on(socketEventName.documentCommentAdd, (payload: DocumentCommentPayload) => {
    socketMetrics.record(socketEventName.documentCommentAdd, "received");

    if (!enforceRateLimit(socket, socketEventName.documentCommentAdd, serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.documentCommentAdd,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

    io.to(documentRoom(documentId)).emit(socketEventName.documentCommentAdd, {
      documentId,
      comment
    });
  });

  socket.on(socketEventName.documentCommentUpdate, (payload: DocumentCommentUpdatePayload) => {
    socketMetrics.record(socketEventName.documentCommentUpdate, "received");

    if (
      !enforceRateLimit(socket, socketEventName.documentCommentUpdate, serverEnv.socketWriteEventsPerWindow)
    ) {
      return;
    }

    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.documentCommentUpdate,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

    io.to(documentRoom(documentId)).emit(socketEventName.documentCommentUpdate, {
      documentId,
      comment: updatedComment
    });
  });

  socket.on(socketEventName.documentCommentDelete, (payload: DocumentCommentDeletePayload) => {
    socketMetrics.record(socketEventName.documentCommentDelete, "received");

    if (
      !enforceRateLimit(socket, socketEventName.documentCommentDelete, serverEnv.socketWriteEventsPerWindow)
    ) {
      return;
    }

    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.documentCommentDelete,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

    io.to(documentRoom(documentId)).emit(socketEventName.documentCommentDelete, {
      documentId,
      commentId: deletedCommentId
    });
  });

  socket.on(socketEventName.documentCursorMove, (payload: CursorPayload) => {
    socketMetrics.record(socketEventName.documentCursorMove, "received");

    if (
      !enforceRateLimit(socket, socketEventName.documentCursorMove, serverEnv.socketCursorEventsPerWindow)
    ) {
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.documentCursorMove,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

  socket.on(socketEventName.documentSave, (payload: DocumentSavePayload) => {
    socketMetrics.record(socketEventName.documentSave, "received");

    if (!enforceRateLimit(socket, socketEventName.documentSave, serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.documentSave,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

  socket.on(socketEventName.boardJoin, async (payload: BoardJoinPayload) => {
    socketMetrics.record(socketEventName.boardJoin, "received");

    if (!enforceRateLimit(socket, socketEventName.boardJoin, serverEnv.socketWriteEventsPerWindow)) {
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

    const account = extractAccountFromRealtimeToken(payload.accountToken, serverEnv.collabSessionSecret);
    const permission = resolveWorkspacePermission(board, account);
    if (board.ownerId && !canReadWorkspace(permission)) {
      socket.emit("error", { message: "작업 공간 접근 권한이 없습니다." });
      return;
    }

    leaveBoard(socket.id);

    const session = resolveSessionFromSocketPayload(payload.sessionId, payload.sessionToken);
    const requestedRole = permission === "viewer" ? "viewer" : sanitizeRole(payload.role);
    const requiredEditorAccessKey =
      permission === "legacy"
        ? (store.getBoardEditorAccessKey(board.id) ?? serverEnv.editorAccessKey)
        : undefined;
    const role =
      permission === "owner" || permission === "editor"
        ? requestedRole
        : await resolveLockedRole(
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
    socket.data.boardParticipant = participant;

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

    void broadcastBoardParticipants(board.id);
  });

  socket.on(socketEventName.boardTitleUpdate, (payload: BoardTitlePayload) => {
    socketMetrics.record(socketEventName.boardTitleUpdate, "received");

    if (!enforceRateLimit(socket, socketEventName.boardTitleUpdate, serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    const boardId = boardBySocket.get(socket.id);
    if (!boardId || payload.boardId !== boardId) {
      socket.emit("error", { message: "Join the board first" });
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.boardTitleUpdate,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

  socket.on(socketEventName.boardShapeAdd, (payload: BoardAddShapePayload) => {
    socketMetrics.record(socketEventName.boardShapeAdd, "received");

    if (!enforceRateLimit(socket, socketEventName.boardShapeAdd, serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.boardShapeAdd,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

  socket.on(socketEventName.boardShapeUpdate, (payload: BoardPatchShapePayload) => {
    socketMetrics.record(socketEventName.boardShapeUpdate, "received");

    if (!enforceRateLimit(socket, socketEventName.boardShapeUpdate, serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.boardShapeUpdate,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

  socket.on(socketEventName.boardShapeRemove, (payload: BoardRemoveShapePayload) => {
    socketMetrics.record(socketEventName.boardShapeRemove, "received");

    if (!enforceRateLimit(socket, socketEventName.boardShapeRemove, serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.boardShapeRemove,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

  socket.on(socketEventName.boardCursor, (payload: BoardCursorPayload) => {
    socketMetrics.record(socketEventName.boardCursor, "received");

    if (!enforceRateLimit(socket, socketEventName.boardCursor, serverEnv.socketCursorEventsPerWindow)) {
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.boardCursor,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

  socket.on(socketEventName.boardUndo, (payload: BoardUndoPayload) => {
    socketMetrics.record(socketEventName.boardUndo, "received");

    if (!enforceRateLimit(socket, socketEventName.boardUndo, serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.boardUndo,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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

  socket.on(socketEventName.boardRedo, (payload: BoardRedoPayload) => {
    socketMetrics.record(socketEventName.boardRedo, "received");

    if (!enforceRateLimit(socket, socketEventName.boardRedo, serverEnv.socketWriteEventsPerWindow)) {
      return;
    }

    if (
      rejectOversizedPayload(
        socket,
        socketEventName.boardRedo,
        payload,
        "요청 본문이 허용 크기를 초과했습니다."
      )
    ) {
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
    socketLogger.info("socket.disconnected", {
      socketId: socket.id
    });
  });
});

const start = async (): Promise<void> => {
  await store.init();
  realtimeAdapterHandle = await configureRedisRealtimeAdapter(io, serverEnv.redisUrl);
  roleLockStore = realtimeAdapterHandle.roleLocks;

  httpServer.listen(serverEnv.port, () => {
    logger.info("server.started", {
      port: serverEnv.port,
      corsOrigins: serverEnv.allowAllCors ? ["*"] : serverEnv.corsOrigins,
      stateBackend: serverEnv.stateBackend,
      redisAdapter: Boolean(serverEnv.redisUrl)
    });
  });
};

const shutdown = async (): Promise<void> => {
  logger.info("server.shutdown.begin");
  socketMetrics.stop();
  await store.close();
  await realtimeAdapterHandle?.close();
  httpServer.close(() => {
    logger.info("server.shutdown.completed");
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
