export interface HistoryEntry {
  id: string;
  at: string;
  actor: string;
  action: "create" | "update" | "save" | "comment";
  summary: string;
  conflictResolvedBy?: "last-write-wins" | "yjs-crdt";
}

export type AccessRole = "viewer" | "editor";

export interface DocumentComment {
  id: string;
  documentId: string;
  authorSessionId: string;
  authorName: string;
  body: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  isProtected: boolean;
  snippet: string;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface DocumentRecord {
  id: string;
  title: string;
  content: string;
  yjsState: string;
  comments: DocumentComment[];
  createdAt: string;
  updatedAt: string;
  version: number;
  history: HistoryEntry[];
}

export type ShapeType = "rect" | "ellipse" | "diamond" | "text" | "connector";

export interface WhiteboardShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  fromShapeId?: string;
  toShapeId?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  fill: string;
  stroke: string;
  createdBy: string;
  updatedAt: string;
}

export interface WhiteboardRecord {
  id: string;
  title: string;
  shapes: WhiteboardShape[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface WhiteboardSummary {
  id: string;
  title: string;
  isProtected: boolean;
  shapeCount: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Participant {
  socketId: string;
  sessionId: string;
  displayName: string;
  color: string;
  role: AccessRole;
  cursorIndex?: number;
  cursorX?: number;
  cursorY?: number;
  isOnline: boolean;
  lastSeenAt: string;
}

export interface EditorSnapshot {
  sessionId: string;
  displayName: string;
  color: string;
}

export type ConnectionState = "connecting" | "online" | "offline";
export type SaveState = "idle" | "saving" | "saved" | "offline";

export const socketEventName = {
  documentJoin: "document:join",
  documentYjsUpdate: "document:yjs:update",
  documentUpdate: "document:update",
  documentCommentAdd: "document:comment:add",
  documentCommentUpdate: "document:comment:update",
  documentCommentDelete: "document:comment:delete",
  documentCursorMove: "cursor:move",
  documentSave: "document:save",
  boardJoin: "board:join",
  boardTitleUpdate: "board:title:update",
  boardShapeAdd: "board:shape:add",
  boardShapeUpdate: "board:shape:update",
  boardShapeRemove: "board:shape:remove",
  boardCursor: "board:cursor",
  boardUndo: "board:undo",
  boardRedo: "board:redo",
  documentState: "document:state",
  participantsUpdate: "participants:update",
  cursorUpdate: "cursor:update",
  documentSaved: "document:saved",
  permissionDenied: "permission:denied",
  documentConflict: "document:conflict",
  boardState: "board:state",
  boardUpdate: "board:update",
  boardCursorUpdate: "board:cursor:update",
  boardConflict: "board:conflict",
  socketError: "error"
} as const;

export type SocketEventName = (typeof socketEventName)[keyof typeof socketEventName];

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

export interface DocumentSavePayload {
  documentId: string;
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

export interface BoardUndoPayload {
  boardId: string;
  baseVersion?: number;
}

export interface BoardRedoPayload {
  boardId: string;
  baseVersion?: number;
}

export interface DocumentStatePayload {
  document: DocumentRecord;
  role: AccessRole;
  comments: DocumentComment[];
  sessionId?: string;
  sessionToken?: string;
  sessionTrusted?: boolean;
}

export interface BoardStatePayload {
  board: WhiteboardRecord;
  role: AccessRole;
  sessionId?: string;
  sessionToken?: string;
  sessionTrusted?: boolean;
}

export interface RealtimeYjsUpdate {
  documentId: string;
  encodedUpdate: string;
  version: number;
  updatedAt: string;
  title: string;
  editor: EditorSnapshot | null;
}

export interface RealtimeDocumentUpdate {
  documentId: string;
  title: string;
  content: string;
  version: number;
  updatedAt: string;
  editor: EditorSnapshot | null;
}

export interface BoardUpdatePayload {
  board: WhiteboardRecord;
  editor?: EditorSnapshot | null;
}

export interface DocumentParticipantsPayload {
  documentId: string;
  participants: Participant[];
}

export interface BoardParticipantsPayload {
  boardId: string;
  participants: Participant[];
}

export interface DocumentCursorUpdatePayload {
  documentId: string;
  participant: Participant;
}

export interface BoardCursorUpdatePayload {
  boardId: string;
  participant: Participant;
}

export interface DocumentCommentEventPayload {
  documentId: string;
  comment: DocumentComment;
}

export interface DocumentCommentDeleteEventPayload {
  documentId: string;
  commentId: string;
}

export interface DocumentSavedPayload {
  documentId: string;
  updatedAt: string;
  version: number;
}

export interface DocumentConflictPayload {
  documentId: string;
  serverVersion: number;
  resolvedWith: "last-write-wins";
}

export interface BoardConflictPayload {
  boardId: string;
  serverVersion: number;
}

export interface PermissionDeniedPayload {
  scope: "document" | "board";
  requiredRole: AccessRole;
  currentRole: AccessRole;
}

export interface SocketErrorPayload {
  message?: string;
}
