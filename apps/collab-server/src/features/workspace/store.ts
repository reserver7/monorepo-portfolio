import { randomUUID } from "node:crypto";
import * as Y from "yjs";
import type {
  DocumentComment,
  DocumentRecord,
  DocumentSummary,
  HistoryEntry,
  WhiteboardRecord,
  WhiteboardShape,
  WhiteboardSummary
} from "../../../../../packages/utils/src/collab/server";
import type {
  AccessRole,
  WorkspaceActivity,
  WorkspaceNotification,
  WorkspaceInvitationStatus,
  WorkspaceMember
} from "../../../../../packages/utils/src/collab/server";
import {
  createStoredEditorAccessKey,
  normalizeStoredEditorAccessKey,
  verifyEditorAccessKey
} from "./security/access-key";
import {
  clone,
  EMPTY_TITLE,
  nowIso,
  sanitizeCommentBody,
  sanitizeDocumentTitle,
  sanitizeMention,
  summarize
} from "./store-document-utils";
import { sanitizeShape } from "./store-shape-utils";
import { createYDoc, decodeBinary, encodeBinary, readYDocState, replaceYText } from "./store-yjs-utils";
import {
  createFileStatePersistence,
  type PersistedWorkspaceState,
  type StatePersistence
} from "./persistence/state-persistence";

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
  authorAccountId?: string;
  authorName: string;
  body: string;
  mentions: string[];
  parentCommentId?: string;
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

interface DeleteDocumentInput {
  documentId: string;
  editorAccessKey?: string;
  ownerId?: string;
}

interface RestoreDocumentInput {
  documentId: string;
  ownerId?: string;
}

interface DeleteBoardInput {
  boardId: string;
  editorAccessKey?: string;
  ownerId?: string;
}

interface RestoreBoardInput {
  boardId: string;
  ownerId?: string;
}

interface WorkspaceMemberInput {
  kind: "document" | "board";
  entityId: string;
  ownerId: string;
  email: string;
  role: AccessRole;
}

interface WorkspaceMemberRemoveInput {
  kind: "document" | "board";
  entityId: string;
  ownerId: string;
  email: string;
}

interface WorkspaceMemberLeaveInput {
  kind: "document" | "board";
  entityId: string;
  accountId: string;
  email: string;
}

interface WorkspaceOwnershipTransferInput {
  kind: "document" | "board";
  entityId: string;
  ownerId: string;
  ownerEmail: string;
  targetEmail: string;
}

interface WorkspaceMemberRoleUpdateInput {
  kind: "document" | "board";
  entityId: string;
  ownerId: string;
  email: string;
  role: AccessRole;
}

interface WorkspaceInvitationResponseInput {
  kind: "document" | "board";
  entityId: string;
  email: string;
  accountId: string;
  status: Exclude<WorkspaceInvitationStatus, "pending">;
}

const MAX_HISTORY = 160;
const MAX_BOARD_STACK = 120;
const MAX_COMMENT_COUNT = 240;
const MAX_WORKSPACE_ACTIVITY = 50;
const MAX_WORKSPACE_NOTIFICATIONS = 50;
const MAX_FAVORITE_WORKSPACE_KEYS = 500;
type WorkspaceRecord = DocumentRecord | WhiteboardRecord;
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const invitationExpiresAt = (): string => new Date(Date.now() + INVITATION_TTL_MS).toISOString();

export class RealtimeStore {
  private readonly documents = new Map<string, DocumentRecord>();
  private readonly documentYDocs = new Map<string, Y.Doc>();
  private readonly documentAccessKeys = new Map<string, string>();
  private readonly boards = new Map<string, WhiteboardRecord>();
  private readonly boardAccessKeys = new Map<string, string>();
  private readonly favoriteWorkspaceKeys = new Map<string, string[]>();
  private readonly boardPast = new Map<string, WhiteboardShape[][]>();
  private readonly boardFuture = new Map<string, WhiteboardShape[][]>();
  private persistTimer: NodeJS.Timeout | null = null;
  private readonly persistence: StatePersistence;

  constructor(persistence?: string | StatePersistence) {
    this.persistence =
      typeof persistence === "object" ? persistence : createFileStatePersistence(persistence);
  }

  async init(): Promise<void> {
    const parsed = await this.persistence.load();

    if (parsed) {
      for (const persistedDocument of parsed.documents ?? []) {
        const normalized: DocumentRecord = {
          ...persistedDocument,
          title: sanitizeDocumentTitle(persistedDocument.title ?? EMPTY_TITLE),
          content: persistedDocument.content ?? "",
          comments: Array.isArray(persistedDocument.comments)
            ? persistedDocument.comments.map((comment: DocumentComment) => ({
                ...comment,
                body: sanitizeCommentBody(comment.body ?? ""),
                mentions: Array.isArray(comment.mentions)
                  ? comment.mentions.map(sanitizeMention).filter((mention: string) => mention.length > 0)
                  : []
              }))
            : [],
          yjsState: typeof persistedDocument.yjsState === "string" ? persistedDocument.yjsState : ""
        };

        this.documents.set(normalized.id, normalized);

        const legacyAccessKey = normalizeStoredEditorAccessKey(
          (persistedDocument as DocumentRecord & { editorAccessKey?: string }).editorAccessKey
        );
        if (legacyAccessKey) {
          this.documentAccessKeys.set(normalized.id, legacyAccessKey);
        }
      }

      for (const board of parsed.boards ?? []) {
        const normalizedBoard: WhiteboardRecord = {
          ...board,
          title: board.title?.trim() || EMPTY_TITLE,
          shapes: Array.isArray(board.shapes) ? board.shapes.map(sanitizeShape) : []
        };
        this.boards.set(normalizedBoard.id, normalizedBoard);

        const legacyAccessKey = normalizeStoredEditorAccessKey(
          (board as WhiteboardRecord & { editorAccessKey?: string }).editorAccessKey
        );
        if (legacyAccessKey) {
          this.boardAccessKeys.set(normalizedBoard.id, legacyAccessKey);
        }
      }

      if (parsed.documentAccessKeys) {
        for (const [documentId, accessKey] of Object.entries(parsed.documentAccessKeys)) {
          const normalized = normalizeStoredEditorAccessKey(accessKey);
          if (normalized) {
            this.documentAccessKeys.set(documentId, normalized);
          }
        }
      }

      if (parsed.boardAccessKeys) {
        for (const [boardId, accessKey] of Object.entries(parsed.boardAccessKeys)) {
          const normalized = normalizeStoredEditorAccessKey(accessKey);
          if (normalized) {
            this.boardAccessKeys.set(boardId, normalized);
          }
        }
      }

      if (parsed.favoriteWorkspaceKeys) {
        for (const [accountId, keys] of Object.entries(parsed.favoriteWorkspaceKeys)) {
          if (Array.isArray(keys)) {
            this.favoriteWorkspaceKeys.set(
              accountId,
              [...new Set(keys.filter((key): key is string => typeof key === "string"))].slice(
                0,
                MAX_FAVORITE_WORKSPACE_KEYS
              )
            );
          }
        }
      }
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
            summary: "Seed document created",
            title: seedTitle,
            content: seedContent
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

  listDocuments(ownerId?: string, accountEmail?: string): DocumentSummary[] {
    const normalizedEmail = accountEmail?.trim().toLowerCase();
    return [...this.documents.values()]
      .filter(
        (document) =>
          !document.deletedAt &&
          (!ownerId ||
            !document.ownerId ||
            document.ownerId === ownerId ||
            document.members?.some(
              (member) => member.accountId === ownerId || member.email.toLowerCase() === normalizedEmail
            ))
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((document) => ({
        id: document.id,
        ownerId: document.ownerId,
        members: document.members,
        title: document.title.trim() || EMPTY_TITLE,
        isProtected: this.documentAccessKeys.has(document.id),
        snippet: summarize(document.content),
        commentCount: document.comments.length,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        version: document.version,
        deletedAt: document.deletedAt
      }));
  }

  getFavoriteWorkspaceKeys(accountId: string): string[] {
    return [...(this.favoriteWorkspaceKeys.get(accountId) ?? [])];
  }

  setFavoriteWorkspaceKeys(accountId: string, keys: string[]): string[] {
    const normalized = [...new Set(keys.filter((key) => typeof key === "string" && key.length > 0))].slice(
      0,
      MAX_FAVORITE_WORKSPACE_KEYS
    );
    this.favoriteWorkspaceKeys.set(accountId, normalized);
    this.schedulePersist();
    return [...normalized];
  }

  listDeletedDocuments(ownerId: string): { documents: DocumentSummary[]; boards: WhiteboardSummary[] } {
    const documents = [...this.documents.values()]
      .filter((document) => document.deletedAt && document.ownerId === ownerId)
      .sort((a, b) => new Date(b.deletedAt ?? 0).getTime() - new Date(a.deletedAt ?? 0).getTime())
      .map((document) => ({
        id: document.id,
        ownerId: document.ownerId,
        title: document.title.trim() || EMPTY_TITLE,
        isProtected: this.documentAccessKeys.has(document.id),
        snippet: summarize(document.content),
        commentCount: document.comments.length,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        version: document.version,
        deletedAt: document.deletedAt
      }));
    const boards = [...this.boards.values()]
      .filter((board) => board.deletedAt && board.ownerId === ownerId)
      .sort((a, b) => new Date(b.deletedAt ?? 0).getTime() - new Date(a.deletedAt ?? 0).getTime())
      .map((board) => ({
        id: board.id,
        ownerId: board.ownerId,
        members: board.members,
        title: board.title.trim() || EMPTY_TITLE,
        isProtected: this.boardAccessKeys.has(board.id),
        shapeCount: board.shapes.length,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        version: board.version,
        deletedAt: board.deletedAt
      }));
    return { documents, boards };
  }

  getDocument(documentId: string): DocumentRecord | null {
    const target = this.documents.get(documentId);
    return target ? clone(target) : null;
  }

  getDocumentEditorAccessKey(documentId: string): string | undefined {
    return this.documentAccessKeys.get(documentId);
  }

  getHistory(documentId: string): HistoryEntry[] {
    return clone(this.documents.get(documentId)?.history ?? []);
  }

  listDocumentComments(documentId: string): DocumentComment[] {
    const comments = this.documents.get(documentId)?.comments ?? [];
    return clone(comments);
  }

  createDocument(
    rawTitle: string,
    actor: string,
    editorAccessKey?: string,
    ownerId?: string
  ): DocumentRecord {
    const now = nowIso();
    const title = sanitizeDocumentTitle(rawTitle);

    const ydoc = createYDoc(title, "");
    const created: DocumentRecord = {
      id: randomUUID(),
      ownerId,
      members: [],
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
          summary: `Created "${title}"`,
          title,
          content: ""
        }
      ]
    };

    this.documents.set(created.id, created);
    this.documentYDocs.set(created.id, ydoc);
    const normalizedEditorAccessKey = createStoredEditorAccessKey(editorAccessKey);
    if (normalizedEditorAccessKey) {
      this.documentAccessKeys.set(created.id, normalizedEditorAccessKey);
    }
    this.schedulePersist();
    return clone(created);
  }

  duplicateDocument(input: { documentId: string; actor: string; ownerId?: string }): DocumentRecord | null {
    const current = this.documents.get(input.documentId);
    if (!current) return null;
    const duplicate = this.createDocument(
      `${current.title.trim() || EMPTY_TITLE} 복사본`,
      input.actor,
      undefined,
      input.ownerId
    );
    const updated = this.updateDocument({
      documentId: duplicate.id,
      content: current.content,
      actor: input.actor
    });
    return updated?.document ?? duplicate;
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
      title: current.title,
      content: current.content,
      conflictResolvedBy: conflict ? "last-write-wins" : undefined
    });

    this.schedulePersist();

    return {
      document: clone(current),
      changed: true,
      conflict
    };
  }

  restoreDocumentVersion(input: {
    documentId: string;
    historyId: string;
    actor: string;
  }): "not-found" | "version-not-found" | { document: DocumentRecord; changed: boolean; conflict: boolean } {
    const current = this.documents.get(input.documentId);
    if (!current) return "not-found";
    const entry = current.history.find((candidate) => candidate.id === input.historyId);
    if (!entry || entry.content === undefined) return "version-not-found";
    return (
      this.updateDocument({
        documentId: input.documentId,
        title: entry.title ?? current.title,
        content: entry.content,
        actor: input.actor
      }) ?? "not-found"
    );
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
      title: current.title,
      content: current.content,
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
    const parentCommentId =
      input.parentCommentId && current.comments.some((comment) => comment.id === input.parentCommentId)
        ? input.parentCommentId
        : undefined;
    const comment: DocumentComment = {
      id: randomUUID(),
      documentId: input.documentId,
      authorSessionId: input.authorSessionId,
      authorAccountId: input.authorAccountId,
      authorName: input.authorName.trim() || "Guest",
      body,
      mentions: Array.from(new Set(input.mentions.map(sanitizeMention))).filter(
        (mention: string) => mention.length > 0
      ),
      parentCommentId,
      createdAt: now,
      updatedAt: now
    };

    current.comments.unshift(comment);
    current.comments = current.comments.slice(0, MAX_COMMENT_COUNT);
    current.updatedAt = now;
    current.version += 1;

    const mentionSummary =
      comment.mentions.length > 0
        ? ` · mentions ${comment.mentions.map((name: string) => `@${name}`).join(", ")}`
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

  createReplyNotification(documentId: string, replyCommentId: string): string | undefined {
    const document = this.documents.get(documentId);
    const reply = document?.comments.find((comment) => comment.id === replyCommentId);
    const parent = reply?.parentCommentId
      ? document?.comments.find((comment) => comment.id === reply.parentCommentId)
      : undefined;
    const recipientId = parent?.authorAccountId;
    if (!document || !reply || !parent || !recipientId || recipientId === reply.authorAccountId) {
      return undefined;
    }

    this.addWorkspaceNotification(document, {
      recipientId,
      action: "replied",
      entityKind: "document",
      entityId: document.id,
      title: document.title,
      memberEmail: parent.authorName,
      commentId: reply.id
    });
    this.schedulePersist();
    return recipientId;
  }

  updateDocumentComment(input: UpdateDocumentCommentInput): DocumentComment | "forbidden" | null {
    const current = this.documents.get(input.documentId);
    if (!current) {
      return null;
    }

    const commentIndex = current.comments.findIndex(
      (comment: DocumentComment) => comment.id === input.commentId
    );
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
        (mention: string) => mention.length > 0
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

    const commentIndex = current.comments.findIndex(
      (comment: DocumentComment) => comment.id === input.commentId
    );
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
      summary: "Auto-saved checkpoint",
      title: current.title,
      content: current.content
    });

    this.schedulePersist();
    return clone(current);
  }

  deleteDocument(
    input: DeleteDocumentInput
  ): "not-found" | "forbidden" | { documentId: string; deletedAt: string } {
    const current = this.documents.get(input.documentId);
    if (!current) {
      return "not-found";
    }

    if (current.ownerId && current.ownerId !== input.ownerId) {
      return "forbidden";
    }

    const requiredAccessKey = current.ownerId ? undefined : this.documentAccessKeys.get(input.documentId);
    if (requiredAccessKey) {
      if (!verifyEditorAccessKey(requiredAccessKey, input.editorAccessKey)) {
        return "forbidden";
      }
    }

    const deletedAt = nowIso();
    current.deletedAt = deletedAt;
    this.schedulePersist();

    return { documentId: input.documentId, deletedAt };
  }

  restoreDocument(input: RestoreDocumentInput): "not-found" | "forbidden" | { documentId: string } {
    const current = this.documents.get(input.documentId);
    if (!current || !current.deletedAt) return "not-found";
    if (current.ownerId !== input.ownerId) return "forbidden";
    delete current.deletedAt;
    this.ensureDocumentYDoc(current.id);
    this.schedulePersist();
    return { documentId: input.documentId };
  }

  permanentlyDeleteDocument(input: RestoreDocumentInput): "not-found" | "forbidden" | { documentId: string } {
    const current = this.documents.get(input.documentId);
    if (!current || !current.deletedAt) return "not-found";
    if (current.ownerId !== input.ownerId) return "forbidden";
    this.documents.delete(input.documentId);
    this.documentYDocs.delete(input.documentId);
    this.documentAccessKeys.delete(input.documentId);
    this.schedulePersist();
    return { documentId: input.documentId };
  }

  listWorkspaceMembers(kind: "document" | "board", entityId: string): WorkspaceMember[] | null {
    const record = kind === "document" ? this.documents.get(entityId) : this.boards.get(entityId);
    return record ? clone(record.members ?? []) : null;
  }

  listWorkspaceActivity(kind: "document" | "board", entityId: string): WorkspaceActivity[] | null {
    const record = kind === "document" ? this.documents.get(entityId) : this.boards.get(entityId);
    return record ? clone(record.activity ?? []) : null;
  }

  listWorkspaceNotifications(accountId: string): WorkspaceNotification[] {
    const notifications = [...this.documents.values(), ...this.boards.values()]
      .flatMap((record) => record.notifications ?? [])
      .filter((notification) => notification.recipientId === accountId)
      .sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
    return clone(notifications.slice(0, MAX_WORKSPACE_NOTIFICATIONS));
  }

  createMentionNotifications(
    documentId: string,
    mentions: string[],
    authorAccountId?: string,
    commentId?: string,
    previousMentions: string[] = []
  ): string[] {
    const document = this.documents.get(documentId);
    if (!document || mentions.length === 0) return [];

    const previousTokens = new Set(
      previousMentions.map(sanitizeMention).map((mention) => mention.toLowerCase())
    );
    const tokens = new Set(
      mentions
        .map(sanitizeMention)
        .map((mention) => mention.toLowerCase())
        .filter((mention) => !previousTokens.has(mention))
    );
    const recipients = (document.members ?? []).filter((member) => {
      if (member.status !== "accepted" || !member.accountId || member.accountId === authorAccountId)
        return false;
      const email = member.email.toLowerCase();
      const localPart = email.split("@", 1)[0] ?? email;
      return tokens.has(member.accountId.toLowerCase()) || tokens.has(email) || tokens.has(localPart);
    });

    for (const member of recipients) {
      this.addWorkspaceNotification(document, {
        recipientId: member.accountId!,
        action: "mentioned",
        entityKind: "document",
        entityId: document.id,
        title: document.title,
        memberEmail: member.email,
        commentId
      });
    }
    if (recipients.length > 0) this.schedulePersist();
    return recipients.map((member) => member.accountId!);
  }

  markWorkspaceNotificationRead(accountId: string, notificationId: string): boolean {
    for (const record of [...this.documents.values(), ...this.boards.values()]) {
      const notification = (record.notifications ?? []).find(
        (candidate) => candidate.id === notificationId && candidate.recipientId === accountId
      );
      if (!notification) continue;
      notification.readAt = nowIso();
      record.updatedAt = nowIso();
      this.schedulePersist();
      return true;
    }
    return false;
  }

  markWorkspaceNotificationsRead(accountId: string): number {
    let count = 0;
    for (const record of [...this.documents.values(), ...this.boards.values()]) {
      for (const notification of record.notifications ?? []) {
        if (notification.recipientId !== accountId || notification.readAt) continue;
        notification.readAt = nowIso();
        count += 1;
      }
      if (count > 0) record.updatedAt = nowIso();
    }
    if (count > 0) this.schedulePersist();
    return count;
  }

  upsertWorkspaceMember(
    input: WorkspaceMemberInput
  ): "not-found" | "forbidden" | "invalid" | WorkspaceMember {
    const record =
      input.kind === "document" ? this.documents.get(input.entityId) : this.boards.get(input.entityId);
    if (!record) return "not-found";
    if (record.ownerId !== input.ownerId) return "forbidden";

    const email = input.email.trim().toLowerCase();
    if (!email || email.length > 320 || input.role === undefined) return "invalid";

    const members = record.members ?? [];
    const existing = members.find((member) => member.email.toLowerCase() === email);
    const status = existing?.status === "accepted" ? "accepted" : "pending";
    const member: WorkspaceMember = {
      accountId: status === "accepted" ? existing?.accountId : undefined,
      email,
      role: input.role,
      invitedAt: existing?.invitedAt ?? nowIso(),
      status,
      respondedAt: status === "accepted" ? existing?.respondedAt : undefined,
      expiresAt: status === "pending" ? invitationExpiresAt() : undefined
    };
    if (existing) {
      Object.assign(existing, member);
    } else {
      members.push(member);
    }
    record.members = members;
    this.addWorkspaceActivity(record, {
      actorId: input.ownerId,
      action: existing?.status === "pending" ? "resent" : "invited",
      memberEmail: member.email,
      role: member.role
    });
    record.updatedAt = nowIso();
    this.schedulePersist();
    return clone(member);
  }

  updateWorkspaceMemberRole(
    input: WorkspaceMemberRoleUpdateInput
  ): "not-found" | "forbidden" | "member-not-found" | "invalid" | WorkspaceMember {
    const record =
      input.kind === "document" ? this.documents.get(input.entityId) : this.boards.get(input.entityId);
    if (!record) return "not-found";
    if (record.ownerId !== input.ownerId) return "forbidden";
    if (input.role !== "viewer" && input.role !== "editor") return "invalid";

    const member = (record.members ?? []).find(
      (candidate) => candidate.email.toLowerCase() === input.email.trim().toLowerCase()
    );
    if (!member || member.status !== "accepted") return "forbidden";

    member.role = input.role;
    this.addWorkspaceActivity(record, {
      actorId: input.ownerId,
      action: "role-changed",
      memberEmail: member.email,
      role: member.role
    });
    if (member.accountId) {
      this.addWorkspaceNotification(record, {
        recipientId: member.accountId,
        action: "role-changed",
        entityKind: input.kind,
        entityId: input.entityId,
        title: record.title,
        memberEmail: member.email
      });
    }
    record.updatedAt = nowIso();
    this.schedulePersist();
    return clone(member);
  }

  respondToWorkspaceInvitation(
    input: WorkspaceInvitationResponseInput
  ): "not-found" | "forbidden" | "member-not-found" | WorkspaceMember {
    const record =
      input.kind === "document" ? this.documents.get(input.entityId) : this.boards.get(input.entityId);
    if (!record) return "not-found";

    const email = input.email.trim().toLowerCase();
    const member = (record.members ?? []).find((candidate) => candidate.email.toLowerCase() === email);
    if (!member) return "forbidden";
    if (member.status === "accepted" || member.status === "declined") return "forbidden";
    if (member.expiresAt && Date.parse(member.expiresAt) <= Date.now()) return "forbidden";

    member.status = input.status;
    member.respondedAt = nowIso();
    if (input.status === "accepted") member.accountId = input.accountId;
    member.expiresAt = undefined;
    record.members = record.members ?? [];
    this.addWorkspaceActivity(record, {
      actorId: input.accountId,
      action: input.status,
      memberEmail: member.email,
      role: member.role
    });
    if (record.ownerId && record.ownerId !== input.accountId) {
      this.addWorkspaceNotification(record, {
        recipientId: record.ownerId,
        action: input.status,
        entityKind: input.kind,
        entityId: input.entityId,
        title: record.title,
        memberEmail: member.email
      });
    }
    record.updatedAt = nowIso();
    this.schedulePersist();
    return clone(member);
  }

  removeWorkspaceMember(
    input: WorkspaceMemberRemoveInput
  ): "not-found" | "forbidden" | "member-not-found" | WorkspaceMember {
    const record =
      input.kind === "document" ? this.documents.get(input.entityId) : this.boards.get(input.entityId);
    if (!record) return "not-found";
    if (record.ownerId !== input.ownerId) return "forbidden";

    const members = record.members ?? [];
    const index = members.findIndex(
      (member) => member.email.toLowerCase() === input.email.trim().toLowerCase()
    );
    if (index === -1) return "member-not-found";
    const [removed] = members.splice(index, 1);
    if (!removed) return "member-not-found";
    record.members = members;
    this.addWorkspaceActivity(record, {
      actorId: input.ownerId,
      action: "removed",
      memberEmail: removed.email,
      role: removed.role
    });
    if (removed.accountId) {
      this.addWorkspaceNotification(record, {
        recipientId: removed.accountId,
        action: "removed",
        entityKind: input.kind,
        entityId: input.entityId,
        title: record.title,
        memberEmail: removed.email
      });
    }
    record.updatedAt = nowIso();
    this.schedulePersist();
    return clone(removed);
  }

  leaveWorkspaceMember(
    input: WorkspaceMemberLeaveInput
  ): "not-found" | "forbidden" | "member-not-found" | WorkspaceMember {
    const record =
      input.kind === "document" ? this.documents.get(input.entityId) : this.boards.get(input.entityId);
    if (!record) return "not-found";
    if (record.ownerId === input.accountId) return "forbidden";

    const members = record.members ?? [];
    const normalizedEmail = input.email.trim().toLowerCase();
    const index = members.findIndex(
      (member) =>
        member.status === "accepted" &&
        ((member.accountId && member.accountId === input.accountId) || member.email === normalizedEmail)
    );
    if (index === -1) return "member-not-found";
    const [left] = members.splice(index, 1);
    if (!left) return "member-not-found";
    record.members = members;
    this.addWorkspaceActivity(record, {
      actorId: input.accountId,
      action: "left",
      memberEmail: left.email,
      role: left.role
    });
    if (record.ownerId) {
      this.addWorkspaceNotification(record, {
        recipientId: record.ownerId,
        action: "left",
        entityKind: input.kind,
        entityId: input.entityId,
        title: record.title,
        memberEmail: left.email
      });
    }
    record.updatedAt = nowIso();
    this.schedulePersist();
    return clone(left);
  }

  transferWorkspaceOwnership(
    input: WorkspaceOwnershipTransferInput
  ): "not-found" | "forbidden" | "member-not-found" | WorkspaceRecord {
    const record =
      input.kind === "document" ? this.documents.get(input.entityId) : this.boards.get(input.entityId);
    if (!record) return "not-found";
    if (record.ownerId !== input.ownerId) return "forbidden";

    const members = record.members ?? [];
    const targetIndex = members.findIndex(
      (member) =>
        member.email === input.targetEmail.trim().toLowerCase() &&
        member.status === "accepted" &&
        Boolean(member.accountId)
    );
    if (targetIndex === -1) return "member-not-found";
    const [target] = members.splice(targetIndex, 1);
    if (!target?.accountId) return "member-not-found";

    record.ownerId = target.accountId;
    members.push({
      accountId: input.ownerId,
      email: input.ownerEmail.trim().toLowerCase(),
      role: "editor",
      invitedAt: nowIso(),
      status: "accepted",
      respondedAt: nowIso()
    });
    record.members = members;
    this.addWorkspaceActivity(record, {
      actorId: input.ownerId,
      action: "ownership-transferred",
      memberEmail: target.email,
      role: "editor"
    });
    this.addWorkspaceNotification(record, {
      recipientId: input.ownerId,
      action: "ownership-transferred",
      entityKind: input.kind,
      entityId: input.entityId,
      title: record.title,
      memberEmail: target.email
    });
    this.addWorkspaceNotification(record, {
      recipientId: target.accountId,
      action: "ownership-transferred",
      entityKind: input.kind,
      entityId: input.entityId,
      title: record.title,
      memberEmail: target.email
    });
    record.updatedAt = nowIso();
    this.schedulePersist();
    return clone(record);
  }

  private addWorkspaceActivity(
    record: DocumentRecord | WhiteboardRecord,
    activity: Omit<WorkspaceActivity, "id" | "at">
  ): void {
    record.activity = [{ id: randomUUID(), at: nowIso(), ...activity }, ...(record.activity ?? [])].slice(
      0,
      MAX_WORKSPACE_ACTIVITY
    );
  }

  private addWorkspaceNotification(
    record: DocumentRecord | WhiteboardRecord,
    notification: Omit<WorkspaceNotification, "id" | "at">
  ): void {
    record.notifications = [
      { id: randomUUID(), at: nowIso(), ...notification },
      ...(record.notifications ?? [])
    ].slice(0, MAX_WORKSPACE_NOTIFICATIONS);
  }

  listBoards(ownerId?: string, accountEmail?: string): WhiteboardSummary[] {
    const normalizedEmail = accountEmail?.trim().toLowerCase();
    return [...this.boards.values()]
      .filter(
        (board) =>
          !board.deletedAt &&
          (!ownerId ||
            !board.ownerId ||
            board.ownerId === ownerId ||
            board.members?.some(
              (member) => member.accountId === ownerId || member.email.toLowerCase() === normalizedEmail
            ))
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((board) => ({
        id: board.id,
        ownerId: board.ownerId,
        title: board.title.trim() || EMPTY_TITLE,
        isProtected: this.boardAccessKeys.has(board.id),
        shapeCount: board.shapes.length,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        version: board.version,
        deletedAt: board.deletedAt
      }));
  }

  getBoard(boardId: string): WhiteboardRecord | null {
    const target = this.boards.get(boardId);
    return target ? clone(target) : null;
  }

  getBoardEditorAccessKey(boardId: string): string | undefined {
    return this.boardAccessKeys.get(boardId);
  }

  createBoard(rawTitle: string, actor: string, editorAccessKey?: string, ownerId?: string): WhiteboardRecord {
    const now = nowIso();
    const title = rawTitle.trim() || EMPTY_TITLE;

    const board: WhiteboardRecord = {
      id: randomUUID(),
      ownerId,
      members: [],
      title,
      shapes: [],
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    this.boards.set(board.id, board);
    this.ensureBoardStack(board.id);
    const normalizedEditorAccessKey = createStoredEditorAccessKey(editorAccessKey);
    if (normalizedEditorAccessKey) {
      this.boardAccessKeys.set(board.id, normalizedEditorAccessKey);
    }

    if (actor) {
      // Keep actor available for future audit extension.
    }

    this.schedulePersist();
    return clone(board);
  }

  duplicateBoard(input: { boardId: string; actor: string; ownerId?: string }): WhiteboardRecord | null {
    const current = this.boards.get(input.boardId);
    if (!current) return null;
    const duplicate = this.createBoard(
      `${current.title.trim() || EMPTY_TITLE} 복사본`,
      input.actor,
      undefined,
      input.ownerId
    );
    const target = this.boards.get(duplicate.id);
    if (!target) return duplicate;
    target.shapes = current.shapes.map((shape) => ({
      ...clone(shape),
      id: randomUUID(),
      createdBy: input.actor,
      updatedAt: nowIso()
    }));
    this.schedulePersist();
    return clone(target);
  }

  updateBoardTitle(
    input: UpdateBoardTitleInput
  ): { board: WhiteboardRecord; changed: boolean; conflict: boolean } | null {
    const board = this.boards.get(input.boardId);
    if (!board) {
      return null;
    }

    const nextTitle = input.title.trim() || EMPTY_TITLE;
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
    if (board.shapes.some((item: WhiteboardShape) => item.id === shape.id)) {
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

    const index = board.shapes.findIndex((shape: WhiteboardShape) => shape.id === input.shapeId);
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

    const shapeIndex = board.shapes.findIndex((shape: WhiteboardShape) => shape.id === input.shapeId);
    if (shapeIndex === -1) {
      return { board: clone(board), changed: false, conflict };
    }

    this.pushBoardSnapshot(board.id, board.shapes);
    const [removedShape] = board.shapes.splice(shapeIndex, 1);
    if (removedShape && removedShape.type !== "connector") {
      board.shapes = board.shapes.filter(
        (shape: WhiteboardShape) =>
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

  deleteBoard(input: DeleteBoardInput): "not-found" | "forbidden" | { boardId: string; deletedAt: string } {
    const board = this.boards.get(input.boardId);
    if (!board) {
      return "not-found";
    }

    if (board.ownerId && board.ownerId !== input.ownerId) {
      return "forbidden";
    }

    const requiredAccessKey = board.ownerId ? undefined : this.boardAccessKeys.get(input.boardId);
    if (requiredAccessKey) {
      if (!verifyEditorAccessKey(requiredAccessKey, input.editorAccessKey)) {
        return "forbidden";
      }
    }

    const deletedAt = nowIso();
    board.deletedAt = deletedAt;
    this.schedulePersist();

    return { boardId: input.boardId, deletedAt };
  }

  restoreBoard(input: RestoreBoardInput): "not-found" | "forbidden" | { boardId: string } {
    const current = this.boards.get(input.boardId);
    if (!current || !current.deletedAt) return "not-found";
    if (current.ownerId !== input.ownerId) return "forbidden";
    delete current.deletedAt;
    this.ensureBoardStack(current.id);
    this.schedulePersist();
    return { boardId: input.boardId };
  }

  permanentlyDeleteBoard(input: RestoreBoardInput): "not-found" | "forbidden" | { boardId: string } {
    const current = this.boards.get(input.boardId);
    if (!current || !current.deletedAt) return "not-found";
    if (current.ownerId !== input.ownerId) return "forbidden";
    this.boards.delete(input.boardId);
    this.boardPast.delete(input.boardId);
    this.boardFuture.delete(input.boardId);
    this.boardAccessKeys.delete(input.boardId);
    this.schedulePersist();
    return { boardId: input.boardId };
  }

  async persistNow(): Promise<void> {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }

    const payload: PersistedWorkspaceState = {
      documents: [...this.documents.values()],
      boards: [...this.boards.values()],
      documentAccessKeys: Object.fromEntries(this.documentAccessKeys.entries()),
      boardAccessKeys: Object.fromEntries(this.boardAccessKeys.entries()),
      favoriteWorkspaceKeys: Object.fromEntries(this.favoriteWorkspaceKeys.entries())
    };

    await this.persistence.save(payload);
  }

  async close(): Promise<void> {
    await this.persistNow();
    await this.persistence.close?.();
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
      const fallback = createYDoc(EMPTY_TITLE, "");
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
