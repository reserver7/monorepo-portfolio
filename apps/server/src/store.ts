import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import * as Y from "yjs";
import type {
  DocumentComment,
  DocumentRecord,
  DocumentSummary,
  HistoryEntry,
  ShapeType,
  WhiteboardRecord,
  WhiteboardShape,
  WhiteboardSummary
} from "@repo/shared-types";

interface PersistedState {
  documents: DocumentRecord[];
  boards: WhiteboardRecord[];
}

interface UpdateDocumentInput {
  documentId: string;
  title?: string;
  content?: string;
  baseVersion?: number;
  actor: string;
}

interface MergeDocumentYjsUpdateInput {
  documentId: string;
  encodedUpdate: string;
  actor: string;
}

interface AddDocumentCommentInput {
  documentId: string;
  authorSessionId: string;
  authorName: string;
  body: string;
  mentions: string[];
}

interface UpdateDocumentCommentInput {
  documentId: string;
  commentId: string;
  authorSessionId: string;
  body: string;
  mentions: string[];
}

interface DeleteDocumentCommentInput {
  documentId: string;
  commentId: string;
  authorSessionId: string;
}

interface UpdateBoardTitleInput {
  boardId: string;
  title: string;
  baseVersion?: number;
  actor: string;
}

interface AddBoardShapeInput {
  boardId: string;
  shape: WhiteboardShape;
  baseVersion?: number;
  actor: string;
}

interface PatchBoardShapeInput {
  boardId: string;
  shapeId: string;
  patch: Partial<WhiteboardShape>;
  baseVersion?: number;
  actor: string;
}

interface RemoveBoardShapeInput {
  boardId: string;
  shapeId: string;
  baseVersion?: number;
  actor: string;
}

const MAX_HISTORY = 160;
const MAX_BOARD_STACK = 120;
const MAX_COMMENT_COUNT = 240;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const summarize = (text: string): string => {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length <= 120 ? compact : `${compact.slice(0, 117)}...`;
};

const nowIso = (): string => new Date().toISOString();

const sanitizeDocumentTitle = (rawTitle: string): string => {
  const normalized = rawTitle.trim();
  return normalized || "Untitled document";
};

const sanitizeCommentBody = (rawBody: string): string => {
  const normalized = rawBody.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 500);
};

const sanitizeMention = (rawMention: string): string => {
  return rawMention.trim().replace(/^@+/, "").slice(0, 24);
};

const encodeBinary = (value: Uint8Array): string => Buffer.from(value).toString("base64");

const decodeBinary = (encoded: string): Uint8Array => {
  return new Uint8Array(Buffer.from(encoded, "base64"));
};

const replaceYText = (ytext: Y.Text, nextValue: string): void => {
  const currentValue = ytext.toString();
  if (currentValue === nextValue) {
    return;
  }

  ytext.delete(0, currentValue.length);
  if (nextValue.length > 0) {
    ytext.insert(0, nextValue);
  }
};

const normalizeShapeType = (rawType: WhiteboardShape["type"]): ShapeType => {
  if (rawType === "text" || rawType === "ellipse" || rawType === "diamond" || rawType === "connector") {
    return rawType;
  }

  return "rect";
};

const sanitizeShapeLink = (rawValue: string | undefined): string | undefined => {
  const value = rawValue?.trim();
  if (!value) {
    return undefined;
  }

  return value.slice(0, 100);
};

const sanitizeCoordinate = (rawValue: number | undefined): number | undefined => {
  if (typeof rawValue !== "number" || Number.isNaN(rawValue) || !Number.isFinite(rawValue)) {
    return undefined;
  }

  return Math.round(rawValue);
};

const sanitizeShape = (shape: WhiteboardShape): WhiteboardShape => {
  const normalizedType = normalizeShapeType(shape.type);
  const now = shape.updatedAt || nowIso();

  if (normalizedType === "connector") {
    const startX = sanitizeCoordinate(shape.startX) ?? Math.round(shape.x);
    const startY = sanitizeCoordinate(shape.startY) ?? Math.round(shape.y);
    const endX = sanitizeCoordinate(shape.endX) ?? Math.round(shape.x + shape.w);
    const endY = sanitizeCoordinate(shape.endY) ?? Math.round(shape.y + shape.h);

    return {
      ...shape,
      type: normalizedType,
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      w: Math.abs(endX - startX),
      h: Math.abs(endY - startY),
      fromShapeId: sanitizeShapeLink(shape.fromShapeId),
      toShapeId: sanitizeShapeLink(shape.toShapeId),
      startX,
      startY,
      endX,
      endY,
      fill: "transparent",
      stroke: shape.stroke || "#475569",
      updatedAt: now
    };
  }

  const fallbackStyles: Record<Exclude<ShapeType, "connector">, { fill: string; stroke: string }> = {
    rect: { fill: "#bfdbfe", stroke: "#2563eb" },
    ellipse: { fill: "#dcfce7", stroke: "#16a34a" },
    diamond: { fill: "#fef3c7", stroke: "#d97706" },
    text: { fill: "#fef3c7", stroke: "#f59e0b" }
  };

  const fallback = fallbackStyles[normalizedType];

  return {
    ...shape,
    type: normalizedType,
    x: Math.round(shape.x),
    y: Math.round(shape.y),
    w: Math.max(28, Math.round(shape.w)),
    h: Math.max(22, Math.round(shape.h)),
    text: shape.text,
    fromShapeId: undefined,
    toShapeId: undefined,
    startX: undefined,
    startY: undefined,
    endX: undefined,
    endY: undefined,
    fill: shape.fill || fallback.fill,
    stroke: shape.stroke || fallback.stroke,
    updatedAt: now
  };
};

const createYDoc = (title: string, content: string): Y.Doc => {
  const ydoc = new Y.Doc();
  ydoc.transact(() => {
    ydoc.getMap<string>("meta").set("title", sanitizeDocumentTitle(title));

    const ytext = ydoc.getText("content");
    if (content.trim().length > 0) {
      ytext.insert(0, content);
    }
  }, "seed");

  return ydoc;
};

const readYDocState = (ydoc: Y.Doc): { title: string; content: string; yjsState: string } => {
  const titleMap = ydoc.getMap<string>("meta");
  const title = sanitizeDocumentTitle(titleMap.get("title") ?? "Untitled document");
  const content = ydoc.getText("content").toString();
  const yjsState = encodeBinary(Y.encodeStateAsUpdate(ydoc));

  return {
    title,
    content,
    yjsState
  };
};

export class RealtimeStore {
  private readonly documents = new Map<string, DocumentRecord>();
  private readonly documentYDocs = new Map<string, Y.Doc>();
  private readonly boards = new Map<string, WhiteboardRecord>();
  private readonly boardPast = new Map<string, WhiteboardShape[][]>();
  private readonly boardFuture = new Map<string, WhiteboardShape[][]>();
  private persistTimer: NodeJS.Timeout | null = null;
  private readonly dataFilePath: string;

  constructor(dataFilePath?: string) {
    this.dataFilePath = dataFilePath ?? path.resolve(process.cwd(), "data", "state.json");
  }

  async init(): Promise<void> {
    await mkdir(path.dirname(this.dataFilePath), { recursive: true });

    try {
      const raw = await readFile(this.dataFilePath, "utf8");
      const parsed = JSON.parse(raw) as PersistedState;

      for (const persistedDocument of parsed.documents ?? []) {
        const normalized: DocumentRecord = {
          ...persistedDocument,
          title: sanitizeDocumentTitle(persistedDocument.title ?? "Untitled document"),
          content: persistedDocument.content ?? "",
          comments: Array.isArray(persistedDocument.comments)
            ? persistedDocument.comments.map((comment) => ({
                ...comment,
                body: sanitizeCommentBody(comment.body ?? ""),
                mentions: Array.isArray(comment.mentions)
                  ? comment.mentions.map(sanitizeMention).filter((mention) => mention.length > 0)
                  : []
              }))
            : [],
          yjsState: typeof persistedDocument.yjsState === "string" ? persistedDocument.yjsState : ""
        };

        this.documents.set(normalized.id, normalized);
      }

      for (const board of parsed.boards ?? []) {
        const normalizedBoard: WhiteboardRecord = {
          ...board,
          title: board.title?.trim() || "Untitled board",
          shapes: Array.isArray(board.shapes) ? board.shapes.map(sanitizeShape) : []
        };
        this.boards.set(normalizedBoard.id, normalizedBoard);
      }
    } catch {
      // Seed fallback is handled below.
    }

    if (this.documents.size === 0) {
      const now = nowIso();
      const seedTitle = "팀 협업 시작 문서";
      const seedContent =
        "# 실시간 협업 문서\n\n이곳에서 팀과 함께 문서를 편집해보세요.\n\n- Yjs CRDT 동기화\n- 댓글/멘션\n- 권한(보기/편집) 분리";

      const seededYDoc = createYDoc(seedTitle, seedContent);
      const seeded: DocumentRecord = {
        id: randomUUID(),
        title: seedTitle,
        content: seedContent,
        yjsState: encodeBinary(Y.encodeStateAsUpdate(seededYDoc)),
        comments: [],
        createdAt: now,
        updatedAt: now,
        version: 1,
        history: [
          {
            id: randomUUID(),
            at: now,
            actor: "system",
            action: "create",
            summary: "Seed document created"
          }
        ]
      };

      this.documents.set(seeded.id, seeded);
      this.documentYDocs.set(seeded.id, seededYDoc);
    }

    if (this.boards.size === 0) {
      const now = nowIso();
      const seededBoard: WhiteboardRecord = {
        id: randomUUID(),
        title: "팀 아이디어 보드",
        createdAt: now,
        updatedAt: now,
        version: 1,
        shapes: [
          {
            id: randomUUID(),
            type: "rect",
            x: 80,
            y: 80,
            w: 180,
            h: 110,
            fill: "#bfdbfe",
            stroke: "#2563eb",
            createdBy: "system",
            updatedAt: now
          },
          {
            id: randomUUID(),
            type: "text",
            x: 300,
            y: 110,
            w: 220,
            h: 64,
            text: "더블클릭으로 텍스트 수정",
            fill: "#fef3c7",
            stroke: "#f59e0b",
            createdBy: "system",
            updatedAt: now
          }
        ]
      };

      this.boards.set(seededBoard.id, seededBoard);
    }

    for (const documentId of this.documents.keys()) {
      this.ensureDocumentYDoc(documentId);
    }

    for (const boardId of this.boards.keys()) {
      this.ensureBoardStack(boardId);
    }

    this.schedulePersist(10);
  }

  listDocuments(): DocumentSummary[] {
    return [...this.documents.values()]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((document) => ({
        id: document.id,
        title: document.title,
        snippet: summarize(document.content),
        commentCount: document.comments.length,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        version: document.version
      }));
  }

  getDocument(documentId: string): DocumentRecord | null {
    const target = this.documents.get(documentId);
    return target ? clone(target) : null;
  }

  getHistory(documentId: string): HistoryEntry[] {
    return clone(this.documents.get(documentId)?.history ?? []);
  }

  listDocumentComments(documentId: string): DocumentComment[] {
    const comments = this.documents.get(documentId)?.comments ?? [];
    return clone(comments);
  }

  createDocument(rawTitle: string, actor: string): DocumentRecord {
    const now = nowIso();
    const title = sanitizeDocumentTitle(rawTitle);

    const ydoc = createYDoc(title, "");
    const created: DocumentRecord = {
      id: randomUUID(),
      title,
      content: "",
      yjsState: encodeBinary(Y.encodeStateAsUpdate(ydoc)),
      comments: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
      history: [
        {
          id: randomUUID(),
          at: now,
          actor,
          action: "create",
          summary: `Created "${title}"`
        }
      ]
    };

    this.documents.set(created.id, created);
    this.documentYDocs.set(created.id, ydoc);
    this.schedulePersist();
    return clone(created);
  }

  updateDocument(
    input: UpdateDocumentInput
  ): { document: DocumentRecord; changed: boolean; conflict: boolean } | null {
    const current = this.documents.get(input.documentId);
    if (!current) {
      return null;
    }

    const ydoc = this.ensureDocumentYDoc(current.id);
    const meta = ydoc.getMap<string>("meta");
    const ytext = ydoc.getText("content");

    const nextTitle = input.title !== undefined ? sanitizeDocumentTitle(input.title) : current.title;
    const nextContent = input.content ?? current.content;

    const titleChanged = nextTitle !== current.title;
    const contentChanged = nextContent !== current.content;
    const conflict =
      typeof input.baseVersion === "number"
        ? input.baseVersion > 0 && input.baseVersion < current.version
        : false;

    if (!titleChanged && !contentChanged) {
      return {
        document: clone(current),
        changed: false,
        conflict
      };
    }

    ydoc.transact(() => {
      meta.set("title", nextTitle);
      replaceYText(ytext, nextContent);
    }, "legacy-update");

    const next = readYDocState(ydoc);
    current.title = next.title;
    current.content = next.content;
    current.yjsState = next.yjsState;
    current.version += 1;
    current.updatedAt = nowIso();

    this.appendHistory(current, {
      id: randomUUID(),
      at: current.updatedAt,
      actor: input.actor,
      action: "update",
      summary: `${titleChanged ? "Title" : "Content"} updated${titleChanged && contentChanged ? " + content synced" : ""}`,
      conflictResolvedBy: conflict ? "last-write-wins" : undefined
    });

    this.schedulePersist();

    return {
      document: clone(current),
      changed: true,
      conflict
    };
  }

  mergeDocumentYjsUpdate(
    input: MergeDocumentYjsUpdateInput
  ): { document: DocumentRecord; changed: boolean; encodedState: string } | null {
    const current = this.documents.get(input.documentId);
    if (!current) {
      return null;
    }

    const ydoc = this.ensureDocumentYDoc(input.documentId);
    const previousState = current.yjsState;
    const previousTitle = current.title;
    const previousContent = current.content;

    try {
      Y.applyUpdate(ydoc, decodeBinary(input.encodedUpdate), "remote");
    } catch {
      return {
        document: clone(current),
        changed: false,
        encodedState: current.yjsState
      };
    }

    const nextState = readYDocState(ydoc);
    const changed = nextState.yjsState !== previousState;

    if (!changed) {
      return {
        document: clone(current),
        changed: false,
        encodedState: current.yjsState
      };
    }

    current.title = nextState.title;
    current.content = nextState.content;
    current.yjsState = nextState.yjsState;
    current.version += 1;
    current.updatedAt = nowIso();

    const changedFields: string[] = [];
    if (current.title !== previousTitle) {
      changedFields.push("Title");
    }
    if (current.content !== previousContent) {
      changedFields.push("Content");
    }

    this.appendHistory(current, {
      id: randomUUID(),
      at: current.updatedAt,
      actor: input.actor,
      action: "update",
      summary:
        changedFields.length > 0
          ? `${changedFields.join(" + ")} synchronized by CRDT`
          : "CRDT state synchronized",
      conflictResolvedBy: "yjs-crdt"
    });

    this.schedulePersist();

    return {
      document: clone(current),
      changed: true,
      encodedState: nextState.yjsState
    };
  }

  addDocumentComment(input: AddDocumentCommentInput): DocumentComment | null {
    const current = this.documents.get(input.documentId);
    if (!current) {
      return null;
    }

    const body = sanitizeCommentBody(input.body);
    if (!body) {
      return null;
    }

    const now = nowIso();
    const comment: DocumentComment = {
      id: randomUUID(),
      documentId: input.documentId,
      authorSessionId: input.authorSessionId,
      authorName: input.authorName.trim() || "Guest",
      body,
      mentions: Array.from(new Set(input.mentions.map(sanitizeMention))).filter(
        (mention) => mention.length > 0
      ),
      createdAt: now,
      updatedAt: now
    };

    current.comments.unshift(comment);
    current.comments = current.comments.slice(0, MAX_COMMENT_COUNT);
    current.updatedAt = now;
    current.version += 1;

    const mentionSummary =
      comment.mentions.length > 0
        ? ` · mentions ${comment.mentions.map((name) => `@${name}`).join(", ")}`
        : "";

    this.appendHistory(current, {
      id: randomUUID(),
      at: now,
      actor: comment.authorName,
      action: "comment",
      summary: `Comment added${mentionSummary}`
    });

    this.schedulePersist();
    return clone(comment);
  }

  updateDocumentComment(input: UpdateDocumentCommentInput): DocumentComment | "forbidden" | null {
    const current = this.documents.get(input.documentId);
    if (!current) {
      return null;
    }

    const commentIndex = current.comments.findIndex((comment) => comment.id === input.commentId);
    if (commentIndex === -1) {
      return null;
    }

    const existingComment = current.comments[commentIndex];
    if (!existingComment) {
      return null;
    }

    if (existingComment.authorSessionId !== input.authorSessionId) {
      return "forbidden";
    }

    const body = sanitizeCommentBody(input.body);
    if (!body) {
      return null;
    }

    const now = nowIso();
    const nextComment: DocumentComment = {
      ...existingComment,
      body,
      mentions: Array.from(new Set(input.mentions.map(sanitizeMention))).filter(
        (mention) => mention.length > 0
      ),
      updatedAt: now
    };

    current.comments[commentIndex] = nextComment;
    current.updatedAt = now;
    current.version += 1;

    this.appendHistory(current, {
      id: randomUUID(),
      at: now,
      actor: nextComment.authorName,
      action: "comment",
      summary: "Comment edited"
    });

    this.schedulePersist();
    return clone(nextComment);
  }

  deleteDocumentComment(input: DeleteDocumentCommentInput): string | "forbidden" | null {
    const current = this.documents.get(input.documentId);
    if (!current) {
      return null;
    }

    const commentIndex = current.comments.findIndex((comment) => comment.id === input.commentId);
    if (commentIndex === -1) {
      return null;
    }

    const existingComment = current.comments[commentIndex];
    if (!existingComment) {
      return null;
    }

    if (existingComment.authorSessionId !== input.authorSessionId) {
      return "forbidden";
    }

    current.comments.splice(commentIndex, 1);

    const now = nowIso();
    current.updatedAt = now;
    current.version += 1;

    this.appendHistory(current, {
      id: randomUUID(),
      at: now,
      actor: existingComment.authorName,
      action: "comment",
      summary: "Comment deleted"
    });

    this.schedulePersist();
    return input.commentId;
  }

  markSaved(documentId: string, actor: string): DocumentRecord | null {
    const current = this.documents.get(documentId);
    if (!current) {
      return null;
    }

    const now = nowIso();
    current.updatedAt = now;

    this.appendHistory(current, {
      id: randomUUID(),
      at: now,
      actor,
      action: "save",
      summary: "Auto-saved checkpoint"
    });

    this.schedulePersist();
    return clone(current);
  }

  listBoards(): WhiteboardSummary[] {
    return [...this.boards.values()]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((board) => ({
        id: board.id,
        title: board.title,
        shapeCount: board.shapes.length,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        version: board.version
      }));
  }

  getBoard(boardId: string): WhiteboardRecord | null {
    const target = this.boards.get(boardId);
    return target ? clone(target) : null;
  }

  createBoard(rawTitle: string, actor: string): WhiteboardRecord {
    const now = nowIso();
    const title = rawTitle.trim() || "Untitled board";

    const board: WhiteboardRecord = {
      id: randomUUID(),
      title,
      shapes: [],
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    this.boards.set(board.id, board);
    this.ensureBoardStack(board.id);

    if (actor) {
      // Keep actor available for future audit extension.
    }

    this.schedulePersist();
    return clone(board);
  }

  updateBoardTitle(
    input: UpdateBoardTitleInput
  ): { board: WhiteboardRecord; changed: boolean; conflict: boolean } | null {
    const board = this.boards.get(input.boardId);
    if (!board) {
      return null;
    }

    const nextTitle = input.title.trim() || "Untitled board";
    const changed = nextTitle !== board.title;
    const conflict =
      typeof input.baseVersion === "number"
        ? input.baseVersion > 0 && input.baseVersion < board.version
        : false;

    if (!changed) {
      return { board: clone(board), changed: false, conflict };
    }

    board.title = nextTitle;
    board.updatedAt = nowIso();
    board.version += 1;

    if (input.actor) {
      // Extension point for actor-specific board logs.
    }

    this.schedulePersist();
    return { board: clone(board), changed: true, conflict };
  }

  addBoardShape(
    input: AddBoardShapeInput
  ): { board: WhiteboardRecord; changed: boolean; conflict: boolean } | null {
    const board = this.boards.get(input.boardId);
    if (!board) {
      return null;
    }

    const conflict =
      typeof input.baseVersion === "number"
        ? input.baseVersion > 0 && input.baseVersion < board.version
        : false;

    const shape = sanitizeShape(input.shape);
    if (board.shapes.some((item) => item.id === shape.id)) {
      return { board: clone(board), changed: false, conflict };
    }

    this.pushBoardSnapshot(board.id, board.shapes);
    board.shapes.push(shape);
    board.updatedAt = nowIso();
    board.version += 1;

    if (input.actor) {
      // Extension point for actor-specific board logs.
    }

    this.schedulePersist();
    return { board: clone(board), changed: true, conflict };
  }

  patchBoardShape(
    input: PatchBoardShapeInput
  ): { board: WhiteboardRecord; changed: boolean; conflict: boolean } | null {
    const board = this.boards.get(input.boardId);
    if (!board) {
      return null;
    }

    const conflict =
      typeof input.baseVersion === "number"
        ? input.baseVersion > 0 && input.baseVersion < board.version
        : false;

    const index = board.shapes.findIndex((shape) => shape.id === input.shapeId);
    if (index === -1) {
      return { board: clone(board), changed: false, conflict };
    }

    const existingShape = board.shapes[index];
    if (!existingShape) {
      return { board: clone(board), changed: false, conflict };
    }

    this.pushBoardSnapshot(board.id, board.shapes);

    board.shapes[index] = sanitizeShape({
      ...existingShape,
      ...input.patch,
      id: existingShape.id,
      updatedAt: nowIso()
    });

    board.updatedAt = nowIso();
    board.version += 1;

    if (input.actor) {
      // Extension point for actor-specific board logs.
    }

    this.schedulePersist();
    return { board: clone(board), changed: true, conflict };
  }

  removeBoardShape(
    input: RemoveBoardShapeInput
  ): { board: WhiteboardRecord; changed: boolean; conflict: boolean } | null {
    const board = this.boards.get(input.boardId);
    if (!board) {
      return null;
    }

    const conflict =
      typeof input.baseVersion === "number"
        ? input.baseVersion > 0 && input.baseVersion < board.version
        : false;

    const shapeIndex = board.shapes.findIndex((shape) => shape.id === input.shapeId);
    if (shapeIndex === -1) {
      return { board: clone(board), changed: false, conflict };
    }

    this.pushBoardSnapshot(board.id, board.shapes);
    const [removedShape] = board.shapes.splice(shapeIndex, 1);
    if (removedShape && removedShape.type !== "connector") {
      board.shapes = board.shapes.filter(
        (shape) =>
          !(
            shape.type === "connector" &&
            (shape.fromShapeId === removedShape.id || shape.toShapeId === removedShape.id)
          )
      );
    }

    board.updatedAt = nowIso();
    board.version += 1;

    if (input.actor) {
      // Extension point for actor-specific board logs.
    }

    this.schedulePersist();
    return { board: clone(board), changed: true, conflict };
  }

  undoBoard(boardId: string): WhiteboardRecord | null {
    const board = this.boards.get(boardId);
    if (!board) {
      return null;
    }

    this.ensureBoardStack(boardId);
    const past = this.boardPast.get(boardId);
    const future = this.boardFuture.get(boardId);

    if (!past || !future || past.length === 0) {
      return clone(board);
    }

    future.push(clone(board.shapes));
    const previous = past.pop();

    board.shapes = clone(previous ?? []);
    board.updatedAt = nowIso();
    board.version += 1;

    this.schedulePersist();
    return clone(board);
  }

  redoBoard(boardId: string): WhiteboardRecord | null {
    const board = this.boards.get(boardId);
    if (!board) {
      return null;
    }

    this.ensureBoardStack(boardId);
    const past = this.boardPast.get(boardId);
    const future = this.boardFuture.get(boardId);

    if (!past || !future || future.length === 0) {
      return clone(board);
    }

    past.push(clone(board.shapes));
    const next = future.pop();

    board.shapes = clone(next ?? []);
    board.updatedAt = nowIso();
    board.version += 1;

    this.schedulePersist();
    return clone(board);
  }

  async persistNow(): Promise<void> {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }

    const payload: PersistedState = {
      documents: [...this.documents.values()],
      boards: [...this.boards.values()]
    };

    const tempPath = `${this.dataFilePath}.tmp-${process.pid}-${Date.now()}`;
    const serialized = JSON.stringify(payload, null, 2);

    await writeFile(tempPath, serialized, "utf8");
    try {
      await rename(tempPath, this.dataFilePath);
    } catch (error) {
      await unlink(tempPath).catch(() => {
        // Ignore temp cleanup errors.
      });
      throw error;
    }
  }

  private appendHistory(document: DocumentRecord, entry: HistoryEntry): void {
    document.history.unshift(entry);
    document.history = document.history.slice(0, MAX_HISTORY);
  }

  private ensureDocumentYDoc(documentId: string): Y.Doc {
    const existing = this.documentYDocs.get(documentId);
    if (existing) {
      return existing;
    }

    const record = this.documents.get(documentId);
    if (!record) {
      const fallback = createYDoc("Untitled document", "");
      return fallback;
    }

    const ydoc = new Y.Doc();
    let appliedPersistedState = false;

    if (record.yjsState) {
      try {
        Y.applyUpdate(ydoc, decodeBinary(record.yjsState), "persisted");
        appliedPersistedState = true;
      } catch {
        appliedPersistedState = false;
      }
    }

    if (!appliedPersistedState) {
      ydoc.transact(() => {
        ydoc.getMap<string>("meta").set("title", sanitizeDocumentTitle(record.title));
        replaceYText(ydoc.getText("content"), record.content);
      }, "hydrate-from-plain");
    }

    const snapshot = readYDocState(ydoc);
    record.title = snapshot.title;
    record.content = snapshot.content;
    record.yjsState = snapshot.yjsState;

    this.documentYDocs.set(documentId, ydoc);
    return ydoc;
  }

  private ensureBoardStack(boardId: string): void {
    if (!this.boardPast.has(boardId)) {
      this.boardPast.set(boardId, []);
    }

    if (!this.boardFuture.has(boardId)) {
      this.boardFuture.set(boardId, []);
    }
  }

  private pushBoardSnapshot(boardId: string, shapes: WhiteboardShape[]): void {
    this.ensureBoardStack(boardId);

    const past = this.boardPast.get(boardId);
    const future = this.boardFuture.get(boardId);

    if (!past || !future) {
      return;
    }

    past.push(clone(shapes));
    while (past.length > MAX_BOARD_STACK) {
      past.shift();
    }

    future.length = 0;
  }

  private schedulePersist(delayMs = 1200): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
    }

    this.persistTimer = setTimeout(() => {
      this.persistNow().catch((error) => {
        console.error("[store] failed to persist state", error);
      });
    }, delayMs);
  }
}
