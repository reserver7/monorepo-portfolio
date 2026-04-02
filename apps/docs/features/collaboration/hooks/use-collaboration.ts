"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { io, Socket } from "socket.io-client";
import * as Y from "yjs";
import type {
  CursorPayload as DocumentCursorMovePayload,
  DocumentCommentDeleteEventPayload,
  DocumentCommentDeletePayload,
  DocumentCommentEventPayload,
  DocumentCommentPayload as DocumentCommentAddPayload,
  DocumentCommentUpdatePayload,
  DocumentConflictPayload,
  DocumentCursorUpdatePayload,
  DocumentJoinPayload,
  DocumentParticipantsPayload,
  DocumentSavePayload,
  DocumentSavedPayload,
  DocumentStatePayload,
  DocumentYjsUpdatePayload,
  Participant as SharedParticipant,
  PermissionDeniedPayload,
  RealtimeDocumentUpdate,
  RealtimeYjsUpdate,
  SocketErrorPayload
} from "@repo/utils/collab";
import { socketEventName } from "@repo/utils/collab";
import { notifyUiSuccess } from "@repo/react-query";
import { API_BASE_URL } from "@/lib/http";
import {
  createGuestName,
  getStoredEditorAccessKey,
  getOrCreateSessionId,
  getStoredSessionToken,
  getStoredYjsSnapshot,
  setStoredSessionIdentity,
  setStoredYjsSnapshot
} from "@/lib/collab";
import { AccessRole, DocumentRecord, Participant } from "@/lib/collab";
import { useCollabStore } from "@/features/collaboration/stores/use-collab-store";

interface UseCollaborationOptions {
  documentId: string;
  displayName: string;
  role: AccessRole;
  editorAccessKey?: string | null;
  initialDocument?: DocumentRecord | null;
  onEditorRequestDenied?: (resolvedRole: AccessRole) => void;
}

const SNAPSHOT_PERSIST_DEBOUNCE_MS = 600;

const toClientTitle = (rawTitle: string): string => {
  return rawTitle.slice(0, 120);
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

const normalizeParticipant = (participant: SharedParticipant): Participant => ({
  ...participant,
  cursorIndex: participant.cursorIndex ?? 0
});

export const useCollaboration = ({
  documentId,
  displayName,
  role,
  editorAccessKey,
  initialDocument,
  onEditorRequestDenied
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
  const storeRole = useCollabStore.use.role();

  const resetForDocument = useCollabStore.use.resetForDocument();
  const hydrateFromServer = useCollabStore.use.hydrateFromServer();
  const setRole = useCollabStore.use.setRole();
  const setDocumentSnapshot = useCollabStore.use.setDocumentSnapshot();
  const setParticipants = useCollabStore.use.setParticipants();
  const upsertParticipant = useCollabStore.use.upsertParticipant();
  const addCommentToStore = useCollabStore.use.addComment();
  const updateCommentInStore = useCollabStore.use.updateComment();
  const removeCommentFromStore = useCollabStore.use.removeComment();
  const setConnection = useCollabStore.use.setConnection();
  const setSaveState = useCollabStore.use.setSaveState();
  const markSavedCheckpoint = useCollabStore.use.markSavedCheckpoint();
  const setConflictMessage = useCollabStore.use.setConflictMessage();
  const pushEvent = useCollabStore.use.pushEvent();

  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string>("");
  const sessionTokenRef = useRef<string>("");
  const onEditorRequestDeniedRef = useRef<((resolvedRole: AccessRole) => void) | undefined>(
    onEditorRequestDenied
  );
  const displayNameRef = useRef<string>(displayName);
  const editorAccessKeyRef = useRef<string | undefined>(
    editorAccessKey?.trim() ? editorAccessKey.trim() : undefined
  );
  const requestedRoleRef = useRef<AccessRole>(role);
  const roleRef = useRef<AccessRole>(role);
  const ydocRef = useRef<Y.Doc | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const snapshotPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorSentAtRef = useRef<number>(0);
  const dirtyRef = useRef<boolean>(false);

  if (!sessionIdRef.current && typeof window !== "undefined") {
    sessionIdRef.current = getOrCreateSessionId();
    sessionTokenRef.current = getStoredSessionToken() ?? "";
  }

  useEffect(() => {
    displayNameRef.current = displayName;
  }, [displayName]);

  useEffect(() => {
    requestedRoleRef.current = role;
  }, [role]);

  useEffect(() => {
    const normalized = editorAccessKey?.trim();
    editorAccessKeyRef.current = normalized && normalized.length > 0 ? normalized : undefined;
  }, [editorAccessKey]);

  useEffect(() => {
    onEditorRequestDeniedRef.current = onEditorRequestDenied;
  }, [onEditorRequestDenied]);

  const emitDocumentJoin = useCallback(
    (targetSocket?: Socket | null) => {
      const socket = targetSocket ?? socketRef.current;
      if (!socket || !socket.connected || !documentId) {
        return;
      }

      const ydoc = ydocRef.current;
      const clientYjsState = ydoc ? encodeBinary(Y.encodeStateAsUpdate(ydoc)) : undefined;

      const payload: DocumentJoinPayload = {
        documentId,
        sessionId: sessionIdRef.current,
        sessionToken: sessionTokenRef.current || undefined,
        displayName: displayNameRef.current.trim() || createGuestName(),
        role: requestedRoleRef.current,
        editorAccessKey: editorAccessKeyRef.current ?? getStoredEditorAccessKey() ?? undefined,
        clientYjsState
      };
      socket.emit(socketEventName.documentJoin, payload);
    },
    [documentId]
  );

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
        ydoc.getMap<string>("meta").set("title", toClientTitle(initialDocument.title));
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

    const flushSnapshotToLocalCache = () => {
      setStoredYjsSnapshot(documentId, encodeBinary(Y.encodeStateAsUpdate(ydoc)));
      snapshotPersistTimerRef.current = null;
    };

    const scheduleSnapshotPersist = () => {
      if (snapshotPersistTimerRef.current) {
        return;
      }

      snapshotPersistTimerRef.current = setTimeout(() => {
        flushSnapshotToLocalCache();
      }, SNAPSHOT_PERSIST_DEBOUNCE_MS);
    };

    const syncStoreFromYDoc = () => {
      const rawTitle = ydoc.getMap<string>("meta").get("title");
      const currentTitle = typeof rawTitle === "string" ? toClientTitle(rawTitle) : "";
      const currentContent = ydoc.getText("content").toString();
      setDocumentSnapshot(currentTitle, currentContent);
      scheduleSnapshotPersist();
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

      const payload: DocumentYjsUpdatePayload = {
        documentId,
        encodedUpdate: encodeBinary(update)
      };
      socket.emit(socketEventName.documentYjsUpdate, payload);
    };

    ydoc.on("update", handleYDocUpdate);

    return () => {
      if (snapshotPersistTimerRef.current) {
        clearTimeout(snapshotPersistTimerRef.current);
        flushSnapshotToLocalCache();
      }

      ydoc.off("update", handleYDocUpdate);
      ydoc.destroy();
      ydocRef.current = null;
    };
  }, [documentId, initialDocument, resetForDocument, setDocumentSnapshot, setSaveState]);

  useEffect(() => {
    if (!documentId) {
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
      emitDocumentJoin(socket);
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

    socket.on(
      socketEventName.documentState,
      ({ document, role: nextRole, comments, sessionId, sessionToken }: DocumentStatePayload) => {
        if (typeof sessionId === "string" && typeof sessionToken === "string") {
          sessionIdRef.current = sessionId;
          sessionTokenRef.current = sessionToken;
          setStoredSessionIdentity(sessionId, sessionToken);
        }

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
      }
    );

    socket.on(socketEventName.documentYjsUpdate, (payload: RealtimeYjsUpdate) => {
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

    socket.on(socketEventName.documentUpdate, (payload: RealtimeDocumentUpdate) => {
      if (payload.documentId !== documentId) {
        return;
      }

      const ydoc = ydocRef.current;
      if (ydoc) {
        ydoc.transact(() => {
          ydoc.getMap<string>("meta").set("title", toClientTitle(payload.title));
          replaceYText(ydoc.getText("content"), payload.content);
        }, "remote");
      }

      markSavedCheckpoint(payload.updatedAt, payload.version);
      dirtyRef.current = false;
    });

    socket.on(
      socketEventName.participantsUpdate,
      ({ documentId: incomingDocumentId, participants }: DocumentParticipantsPayload) => {
        if (incomingDocumentId !== documentId) {
          return;
        }

        setParticipants(participants.map(normalizeParticipant));
      }
    );

    socket.on(
      socketEventName.cursorUpdate,
      ({ documentId: incomingDocumentId, participant }: DocumentCursorUpdatePayload) => {
        if (incomingDocumentId !== documentId) {
          return;
        }

        upsertParticipant(normalizeParticipant(participant));
      }
    );

    socket.on(socketEventName.documentCommentAdd, ({ comment }: DocumentCommentEventPayload) => {
      addCommentToStore(comment);
      const mentionHit = comment.mentions.some(
        (mention) => mention === displayNameRef.current || mention === sessionIdRef.current
      );

      if (mentionHit && comment.authorSessionId !== sessionIdRef.current) {
        pushEvent(`${comment.authorName} 님이 회원님을 멘션했습니다.`);
        return;
      }

      if (comment.authorSessionId !== sessionIdRef.current) {
        pushEvent(`${comment.authorName} 님이 댓글을 남겼습니다.`);
      }
    });

    socket.on(socketEventName.documentCommentUpdate, ({ comment }: DocumentCommentEventPayload) => {
      updateCommentInStore(comment);
      if (comment.authorSessionId !== sessionIdRef.current) {
        pushEvent(`${comment.authorName} 님이 댓글을 수정했습니다.`);
      }
    });

    socket.on(socketEventName.documentCommentDelete, ({ commentId }: DocumentCommentDeleteEventPayload) => {
      removeCommentFromStore(commentId);
      pushEvent("댓글이 삭제되었습니다.");
      notifyUiSuccess("댓글이 삭제되었습니다.");
    });

    socket.on(
      socketEventName.documentSaved,
      ({ documentId: incomingDocumentId, updatedAt, version: savedVersion }: DocumentSavedPayload) => {
        if (incomingDocumentId !== documentId) {
          return;
        }

        markSavedCheckpoint(updatedAt, savedVersion);
        dirtyRef.current = false;
      }
    );

    socket.on(socketEventName.permissionDenied, ({ scope, currentRole }: PermissionDeniedPayload) => {
      if (scope !== "document") {
        return;
      }

      const wasRequestingEditor = requestedRoleRef.current === "editor";
      roleRef.current = currentRole;
      setRole(currentRole);
      setSaveState("idle");
      pushEvent("읽기 전용 권한으로 전환되어 편집이 제한됩니다.");

      if (wasRequestingEditor && currentRole !== "editor") {
        requestedRoleRef.current = currentRole;
        editorAccessKeyRef.current = undefined;
        onEditorRequestDeniedRef.current?.(currentRole);
      }
    });

    socket.on(
      socketEventName.documentConflict,
      ({ documentId: incomingDocumentId, serverVersion }: DocumentConflictPayload) => {
        if (incomingDocumentId !== documentId) {
          return;
        }

        setConflictMessage(
          `동시 수정 충돌이 감지되어 서버 기준(last-write-wins)으로 정리되었습니다. (서버 버전 ${serverVersion})`
        );
        pushEvent("충돌이 감지되어 서버 기준으로 병합되었습니다.");
      }
    );

    socket.on(socketEventName.socketError, ({ message }: SocketErrorPayload) => {
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
    documentId,
    emitDocumentJoin,
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

  useEffect(() => {
    if (!documentId) {
      return;
    }

    const timer = setTimeout(() => {
      emitDocumentJoin();
    }, 180);

    return () => {
      clearTimeout(timer);
    };
  }, [documentId, displayName, role, editorAccessKey, emitDocumentJoin]);

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
        ydoc.getMap<string>("meta").set("title", toClientTitle(nextTitle));
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

      const payload: DocumentCursorMovePayload = {
        documentId,
        cursorIndex
      };
      socket.emit(socketEventName.documentCursorMove, payload);
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

    const payload: DocumentSavePayload = {
      documentId
    };
    socket.emit(socketEventName.documentSave, payload);
  }, [documentId]);

  const addComment = useCallback(
    (commentBody: string, mentions: string[] = []) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        pushEvent("오프라인 상태에서는 댓글을 전송할 수 없습니다.");
        return;
      }

      const payload: DocumentCommentAddPayload = {
        documentId,
        body: commentBody,
        mentions
      };
      socket.emit(socketEventName.documentCommentAdd, payload);
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

      const payload: DocumentCommentUpdatePayload = {
        documentId,
        commentId,
        body: commentBody,
        mentions
      };
      socket.emit(socketEventName.documentCommentUpdate, payload);
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

      const payload: DocumentCommentDeletePayload = {
        documentId,
        commentId
      };
      socket.emit(socketEventName.documentCommentDelete, payload);
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
