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
