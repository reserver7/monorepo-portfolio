"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { io, Socket } from "socket.io-client";
import * as Y from "yjs";
import { API_BASE_URL } from "@/lib/api";
import {
  createGuestName,
  getOrCreateSessionId,
  getStoredYjsSnapshot,
  setStoredYjsSnapshot
} from "@/lib/session";
import {
  AccessRole,
  DocumentComment,
  DocumentRecord,
  Participant,
  RealtimeDocumentUpdate,
  RealtimeYjsUpdate
} from "@/lib/types";
import { useCollabStore } from "@/stores/use-collab-store";

interface UseCollaborationOptions {
  documentId: string;
  displayName: string;
  role: AccessRole;
  initialDocument?: DocumentRecord | null;
}

interface DocumentStatePayload {
  document: DocumentRecord;
  role: AccessRole;
  comments: DocumentComment[];
}

interface ParticipantsPayload {
  documentId: string;
  participants: Participant[];
}

interface CursorPayload {
  documentId: string;
  participant: Participant;
}

interface SavedPayload {
  documentId: string;
  updatedAt: string;
  version: number;
}

interface CommentPayload {
  documentId: string;
  comment: DocumentComment;
}

interface CommentDeletePayload {
  documentId: string;
  commentId: string;
}

interface ConflictPayload {
  documentId: string;
  serverVersion: number;
  resolvedWith: "last-write-wins";
}

interface PermissionDeniedPayload {
  scope: "document" | "board";
  requiredRole: AccessRole;
  currentRole: AccessRole;
}

const normalizeTitle = (rawTitle: string): string => {
  const trimmed = rawTitle.trim();
  return trimmed || "Untitled document";
};

const encodeBinary = (value: Uint8Array): string => {
  let serialized = "";
  for (let index = 0; index < value.byteLength; index += 1) {
    serialized += String.fromCharCode(value[index] ?? 0);
  }

  return globalThis.btoa(serialized);
};

const decodeBinary = (encoded: string): Uint8Array => {
  const decoded = globalThis.atob(encoded);
  const bytes = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return bytes;
};

const replaceYText = (ytext: Y.Text, nextValue: string): void => {
  const currentValue = ytext.toString();
  if (currentValue === nextValue) {
    return;
  }

  let prefixLength = 0;
  while (
    prefixLength < currentValue.length &&
    prefixLength < nextValue.length &&
    currentValue[prefixLength] === nextValue[prefixLength]
  ) {
    prefixLength += 1;
  }

  let currentSuffixLength = currentValue.length;
  let nextSuffixLength = nextValue.length;

  while (
    currentSuffixLength > prefixLength &&
    nextSuffixLength > prefixLength &&
    currentValue[currentSuffixLength - 1] === nextValue[nextSuffixLength - 1]
  ) {
    currentSuffixLength -= 1;
    nextSuffixLength -= 1;
  }

  const deleteLength = currentSuffixLength - prefixLength;
  if (deleteLength > 0) {
    ytext.delete(prefixLength, deleteLength);
  }

  const insertChunk = nextValue.slice(prefixLength, nextSuffixLength);
  if (insertChunk.length > 0) {
    ytext.insert(prefixLength, insertChunk);
  }
};

export const useCollaboration = ({
  documentId,
  displayName,
  role,
  initialDocument
}: UseCollaborationOptions): {
  sessionId: string;
  currentRole: AccessRole;
  isReadOnly: boolean;
  updateTitle: (nextTitle: string) => void;
  updateContent: (nextContent: string) => void;
  sendCursor: (cursorIndex: number) => void;
  forceSave: () => void;
  addComment: (commentBody: string, mentions?: string[]) => void;
  updateComment: (commentId: string, commentBody: string, mentions?: string[]) => void;
  deleteComment: (commentId: string) => void;
} => {
  const storeRole = useCollabStore((state) => state.role);

  const resetForDocument = useCollabStore((state) => state.resetForDocument);
  const hydrateFromServer = useCollabStore((state) => state.hydrateFromServer);
  const setRole = useCollabStore((state) => state.setRole);
  const setTitle = useCollabStore((state) => state.setTitle);
  const setContent = useCollabStore((state) => state.setContent);
  const setParticipants = useCollabStore((state) => state.setParticipants);
  const upsertParticipant = useCollabStore((state) => state.upsertParticipant);
  const addCommentToStore = useCollabStore((state) => state.addComment);
  const updateCommentInStore = useCollabStore((state) => state.updateComment);
  const removeCommentFromStore = useCollabStore((state) => state.removeComment);
  const setConnection = useCollabStore((state) => state.setConnection);
  const setSaveState = useCollabStore((state) => state.setSaveState);
  const markSavedCheckpoint = useCollabStore((state) => state.markSavedCheckpoint);
  const setConflictMessage = useCollabStore((state) => state.setConflictMessage);
  const pushEvent = useCollabStore((state) => state.pushEvent);

  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string>("");
  const roleRef = useRef<AccessRole>(role);
  const ydocRef = useRef<Y.Doc | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cursorSentAtRef = useRef<number>(0);
  const dirtyRef = useRef<boolean>(false);

  if (!sessionIdRef.current && typeof window !== "undefined") {
    sessionIdRef.current = getOrCreateSessionId();
  }

  useEffect(() => {
    roleRef.current = role;
    setRole(role);
  }, [role, setRole]);

  useEffect(() => {
    if (!documentId) {
      return;
    }

    resetForDocument(documentId, initialDocument ?? null);

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    if (initialDocument?.yjsState) {
      try {
        Y.applyUpdate(ydoc, decodeBinary(initialDocument.yjsState), "seed");
      } catch {
        // Falls back to plain text hydration below.
      }
    }

    if (ydoc.getText("content").toString().length === 0 && initialDocument) {
      ydoc.transact(() => {
        ydoc.getMap<string>("meta").set("title", normalizeTitle(initialDocument.title));
        const ytext = ydoc.getText("content");
        if (initialDocument.content.length > 0) {
          ytext.insert(0, initialDocument.content);
        }
      }, "seed-plain");
    }

    const persistedSnapshot = getStoredYjsSnapshot(documentId);
    if (persistedSnapshot) {
      try {
        Y.applyUpdate(ydoc, decodeBinary(persistedSnapshot), "local-cache");
      } catch {
        // Ignore malformed local cache.
      }
    }

    const syncStoreFromYDoc = () => {
      const currentTitle = normalizeTitle(ydoc.getMap<string>("meta").get("title") ?? "Untitled document");
      const currentContent = ydoc.getText("content").toString();
      setTitle(currentTitle);
      setContent(currentContent);
      setStoredYjsSnapshot(documentId, encodeBinary(Y.encodeStateAsUpdate(ydoc)));
    };

    syncStoreFromYDoc();

    const handleYDocUpdate = (update: Uint8Array, origin: unknown) => {
      syncStoreFromYDoc();

      const socket = socketRef.current;
      if (origin === "remote") {
        return;
      }

      dirtyRef.current = true;
      setSaveState("saving");

      if (roleRef.current !== "editor") {
        return;
      }

      if (!socket || !socket.connected) {
        setSaveState("offline");
        return;
      }

      socket.emit("document:yjs:update", {
        documentId,
        encodedUpdate: encodeBinary(update)
      });
    };

    ydoc.on("update", handleYDocUpdate);

    return () => {
      ydoc.off("update", handleYDocUpdate);
      ydoc.destroy();
      ydocRef.current = null;
    };
  }, [documentId, initialDocument, resetForDocument, setContent, setSaveState, setTitle]);

  useEffect(() => {
    if (!documentId || !displayName) {
      return;
    }

    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
      reconnection: true
    });

    socketRef.current = socket;
    setConnection("connecting");

    socket.on("connect", () => {
      setConnection("online");
      setConflictMessage(null);
      pushEvent("실시간 연결이 활성화되었습니다.");

      const ydoc = ydocRef.current;
      const clientYjsState = ydoc ? encodeBinary(Y.encodeStateAsUpdate(ydoc)) : undefined;

      socket.emit("document:join", {
        documentId,
        sessionId: sessionIdRef.current,
        displayName: displayName.trim() || createGuestName(),
        role: roleRef.current,
        clientYjsState
      });
    });

    socket.on("disconnect", () => {
      setConnection("offline");
      setSaveState("offline");
      pushEvent("연결이 끊어져 오프라인 상태입니다.");
    });

    socket.on("connect_error", () => {
      setConnection("offline");
      setSaveState("offline");
      pushEvent("서버 연결 실패. 자동 재시도 중입니다.");
    });

    socket.on("document:state", ({ document, role: nextRole, comments }: DocumentStatePayload) => {
      const ydoc = ydocRef.current;
      if (ydoc) {
        try {
          Y.applyUpdate(ydoc, decodeBinary(document.yjsState), "remote");
        } catch {
          // Keep local state if server payload is malformed.
        }
      }

      roleRef.current = nextRole;
      hydrateFromServer(document, nextRole, comments);
      markSavedCheckpoint(document.updatedAt, document.version);
      setConflictMessage(null);

      dirtyRef.current = false;

      pushEvent(`문서 최신 상태를 수신했습니다. (권한: ${nextRole})`);
    });

    socket.on("document:yjs:update", (payload: RealtimeYjsUpdate) => {
      const ydoc = ydocRef.current;
      if (!ydoc || payload.documentId !== documentId) {
        return;
      }

      try {
        Y.applyUpdate(ydoc, decodeBinary(payload.encodedUpdate), "remote");
      } catch {
        return;
      }

      markSavedCheckpoint(payload.updatedAt, payload.version);

      if (payload.editor && payload.editor.sessionId !== sessionIdRef.current) {
        pushEvent(`${payload.editor.displayName} 님의 변경사항이 동기화되었습니다.`);
      }

      dirtyRef.current = false;
    });

    socket.on("document:update", (payload: RealtimeDocumentUpdate) => {
      if (payload.documentId !== documentId) {
        return;
      }

      const ydoc = ydocRef.current;
      if (ydoc) {
        ydoc.transact(() => {
          ydoc.getMap<string>("meta").set("title", normalizeTitle(payload.title));
          replaceYText(ydoc.getText("content"), payload.content);
        }, "remote");
      }

      markSavedCheckpoint(payload.updatedAt, payload.version);
      dirtyRef.current = false;
    });

    socket.on("participants:update", ({ participants }: ParticipantsPayload) => {
      setParticipants(participants);
    });

    socket.on("cursor:update", ({ participant }: CursorPayload) => {
      upsertParticipant(participant);
    });

    socket.on("document:comment:add", ({ comment }: CommentPayload) => {
      addCommentToStore(comment);
      const mentionHit = comment.mentions.some(
        (mention) => mention === displayName || mention === sessionIdRef.current
      );

      if (mentionHit && comment.authorSessionId !== sessionIdRef.current) {
        pushEvent(`${comment.authorName} 님이 회원님을 멘션했습니다.`);
        return;
      }

      if (comment.authorSessionId !== sessionIdRef.current) {
        pushEvent(`${comment.authorName} 님이 댓글을 남겼습니다.`);
      }
    });

    socket.on("document:comment:update", ({ comment }: CommentPayload) => {
      updateCommentInStore(comment);
      if (comment.authorSessionId !== sessionIdRef.current) {
        pushEvent(`${comment.authorName} 님이 댓글을 수정했습니다.`);
      }
    });

    socket.on("document:comment:delete", ({ commentId }: CommentDeletePayload) => {
      removeCommentFromStore(commentId);
      pushEvent("댓글이 삭제되었습니다.");
    });

    socket.on("document:saved", ({ updatedAt, version: savedVersion }: SavedPayload) => {
      markSavedCheckpoint(updatedAt, savedVersion);
      dirtyRef.current = false;
    });

    socket.on("permission:denied", ({ scope, currentRole }: PermissionDeniedPayload) => {
      if (scope !== "document") {
        return;
      }

      roleRef.current = currentRole;
      setRole(currentRole);
      setSaveState("idle");
      pushEvent("읽기 전용 권한으로 전환되어 편집이 제한됩니다.");
    });

    socket.on("document:conflict", ({ serverVersion }: ConflictPayload) => {
      setConflictMessage(
        `동시 수정 충돌이 감지되어 서버 기준(last-write-wins)으로 정리되었습니다. (서버 버전 ${serverVersion})`
      );
      pushEvent("충돌이 감지되어 서버 기준으로 병합되었습니다.");
    });

    socket.on("error", ({ message }: { message?: string }) => {
      if (message) {
        pushEvent(message);
      }
    });

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      socket.disconnect();
      socketRef.current = null;
      setParticipants([]);
      setConnection("offline");
    };
  }, [
    addCommentToStore,
    displayName,
    documentId,
    hydrateFromServer,
    markSavedCheckpoint,
    pushEvent,
    removeCommentFromStore,
    setConflictMessage,
    setConnection,
    setParticipants,
    setRole,
    setSaveState,
    updateCommentInStore,
    upsertParticipant
  ]);

  const updateTitle = useCallback(
    (nextTitle: string) => {
      if (roleRef.current !== "editor") {
        return;
      }

      const ydoc = ydocRef.current;
      if (!ydoc) {
        return;
      }

      ydoc.transact(() => {
        ydoc.getMap<string>("meta").set("title", normalizeTitle(nextTitle));
      }, "local");
    },
    [ydocRef]
  );

  const updateContent = useCallback((nextContent: string) => {
    if (roleRef.current !== "editor") {
      return;
    }

    const ydoc = ydocRef.current;
    if (!ydoc) {
      return;
    }

    ydoc.transact(() => {
      replaceYText(ydoc.getText("content"), nextContent);
    }, "local");
  }, []);

  const sendCursor = useCallback(
    (cursorIndex: number) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        return;
      }

      const now = Date.now();
      if (now - cursorSentAtRef.current < 80) {
        return;
      }

      cursorSentAtRef.current = now;

      socket.emit("cursor:move", {
        documentId,
        cursorIndex
      });
    },
    [documentId]
  );

  const forceSave = useCallback(() => {
    if (roleRef.current !== "editor") {
      return;
    }

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      return;
    }

    socket.emit("document:save", {
      documentId
    });
  }, [documentId]);

  const addComment = useCallback(
    (commentBody: string, mentions: string[] = []) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        pushEvent("오프라인 상태에서는 댓글을 전송할 수 없습니다.");
        return;
      }

      socket.emit("document:comment:add", {
        documentId,
        body: commentBody,
        mentions
      });
    },
    [documentId, pushEvent]
  );

  const updateComment = useCallback(
    (commentId: string, commentBody: string, mentions: string[] = []) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        pushEvent("오프라인 상태에서는 댓글을 수정할 수 없습니다.");
        return;
      }

      socket.emit("document:comment:update", {
        documentId,
        commentId,
        body: commentBody,
        mentions
      });
    },
    [documentId, pushEvent]
  );

  const deleteComment = useCallback(
    (commentId: string) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        pushEvent("오프라인 상태에서는 댓글을 삭제할 수 없습니다.");
        return;
      }

      socket.emit("document:comment:delete", {
        documentId,
        commentId
      });
    },
    [documentId, pushEvent]
  );

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setInterval(() => {
      if (!dirtyRef.current || roleRef.current !== "editor") {
        return;
      }

      forceSave();
    }, 5000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [forceSave]);

  const isReadOnly = useMemo(() => storeRole !== "editor", [storeRole]);

  return {
    sessionId: sessionIdRef.current,
    currentRole: storeRole,
    isReadOnly,
    updateTitle,
    updateContent,
    sendCursor,
    forceSave,
    addComment,
    updateComment,
    deleteComment
  };
};
