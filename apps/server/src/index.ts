import { randomUUID } from "node:crypto";
import http from "node:http";
import cors from "cors";
import express from "express";
import { Server, Socket } from "socket.io";
import type { AccessRole, EditorSnapshot, Participant, WhiteboardShape } from "@repo/shared-types";
import { serverEnv } from "./config/env";
import { RealtimeStore } from "./store";

interface DocumentJoinPayload {
  documentId: string;
  sessionId?: string;
  displayName?: string;
  role?: AccessRole;
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
  displayName?: string;
  role?: AccessRole;
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

const corsOrigins = serverEnv.corsOrigins.length > 0 ? serverEnv.corsOrigins : true;

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

const documentRoom = (documentId: string): string => `document:${documentId}`;
const boardRoom = (boardId: string): string => `board:${boardId}`;

const COLORS = ["#0284c7", "#0f766e", "#16a34a", "#ca8a04", "#ea580c", "#dc2626", "#9333ea", "#4f46e5"];
const mentionPattern = /@([0-9A-Za-z가-힣._-]{2,24})/g;

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
    }
  }

  boardBySocket.delete(socketId);
  broadcastBoardParticipants(joinedBoardId);
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get("/api/documents", (_req, res) => {
  res.json({ documents: store.listDocuments() });
});

app.post("/api/documents", (req, res) => {
  const actor = sanitizeDisplayName(req.body?.actor as string | undefined);
  const title = typeof req.body?.title === "string" ? req.body.title : "Untitled document";
  const created = store.createDocument(title, actor);
  res.status(201).json({ document: created });
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

  const body = typeof req.body?.body === "string" ? req.body.body : "";
  const comment = store.addDocumentComment({
    documentId: document.id,
    authorSessionId: typeof req.body?.authorSessionId === "string" ? req.body.authorSessionId : randomUUID(),
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

  res.status(201).json({ documentId: document.id, comment });
});

app.get("/api/boards", (_req, res) => {
  res.json({ boards: store.listBoards() });
});

app.post("/api/boards", (req, res) => {
  const actor = sanitizeDisplayName(req.body?.actor as string | undefined);
  const title = typeof req.body?.title === "string" ? req.body.title : "Untitled board";
  const board = store.createBoard(title, actor);
  res.status(201).json({ board });
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

    const sessionId = payload.sessionId?.trim() || randomUUID();
    const role = sanitizeRole(payload.role);
    const participant: Participant = {
      socketId: socket.id,
      sessionId,
      displayName: sanitizeDisplayName(payload.displayName),
      color: colorFromSession(sessionId),
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
      store.mergeDocumentYjsUpdate({
        documentId: document.id,
        encodedUpdate: payload.clientYjsState,
        actor: participant.displayName
      });
    }

    const latestDocument = store.getDocument(document.id);
    if (!latestDocument) {
      socket.emit("error", { message: "Document not found" });
      return;
    }

    socket.emit("document:state", {
      document: latestDocument,
      role,
      comments: store.listDocumentComments(document.id)
    });

    broadcastDocumentParticipants(document.id);
  });

  socket.on("document:yjs:update", (payload: DocumentYjsUpdatePayload) => {
    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
      return;
    }

    if (!payload.encodedUpdate) {
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
    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
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
    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
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
    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
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
    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      socket.emit("error", { message: "Join the document first" });
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
    const documentId = documentBySocket.get(socket.id);
    if (!documentId || payload.documentId !== documentId) {
      return;
    }

    const participant = documentParticipants.get(documentId)?.get(socket.id);
    if (!participant) {
      return;
    }

    participant.cursorIndex = Math.max(0, Math.floor(payload.cursorIndex ?? 0));
    participant.lastSeenAt = new Date().toISOString();

    socket.to(documentRoom(documentId)).emit("cursor:update", {
      documentId,
      participant: publicParticipant(participant)
    });
  });

  socket.on("document:save", ({ documentId }: { documentId: string }) => {
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

    const sessionId = payload.sessionId?.trim() || randomUUID();
    const role = sanitizeRole(payload.role);
    const participant: Participant = {
      socketId: socket.id,
      sessionId,
      displayName: sanitizeDisplayName(payload.displayName),
      color: colorFromSession(sessionId),
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
      role
    });

    broadcastBoardParticipants(board.id);
  });

  socket.on("board:title:update", (payload: BoardTitlePayload) => {
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
    const boardId = boardBySocket.get(socket.id);
    if (!boardId || payload.boardId !== boardId) {
      return;
    }

    const participant = boardParticipants.get(boardId)?.get(socket.id);
    if (!participant) {
      return;
    }

    participant.cursorX = Math.max(0, Math.round(payload.x ?? 0));
    participant.cursorY = Math.max(0, Math.round(payload.y ?? 0));
    participant.lastSeenAt = new Date().toISOString();

    socket.to(boardRoom(boardId)).emit("board:cursor:update", {
      boardId,
      participant: publicParticipant(participant)
    });
  });

  socket.on("board:undo", ({ boardId }: { boardId: string }) => {
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

  socket.on("board:redo", ({ boardId }: { boardId: string }) => {
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
