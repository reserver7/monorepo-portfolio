"use client";

import { useCallback, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type {
  BoardAddShapePayload,
  BoardConflictPayload,
  BoardCursorPayload,
  BoardCursorUpdatePayload,
  BoardJoinPayload,
  BoardParticipantsPayload,
  BoardPatchShapePayload,
  BoardRedoPayload,
  BoardRemoveShapePayload,
  BoardStatePayload,
  BoardTitlePayload,
  BoardUndoPayload,
  BoardUpdatePayload,
  Participant as SharedParticipant,
  PermissionDeniedPayload,
  SocketErrorPayload
} from "@repo/utils/collab";
import { socketEventName } from "@repo/utils/collab";
import { API_BASE_URL } from "@/features/whiteboard/boards/api";
import {
  createGuestName,
  getOrCreateSessionId,
  getStoredEditorAccessKey,
  getStoredSessionToken,
  setStoredSessionIdentity
} from "@/features/whiteboard/collaboration/model";
import { AccessRole, Participant, WhiteboardRecord, WhiteboardShape } from "@/features/whiteboard/collaboration/model";
import { useWhiteboardStore } from "@/features/whiteboard/canvas/stores/use-whiteboard-store";

interface UseWhiteboardRealtimeOptions {
  boardId: string;
  displayName: string;
  role: AccessRole;
  editorAccessKey?: string | null;
  initialBoard?: WhiteboardRecord | null;
  onEditorRequestDenied?: (resolvedRole: AccessRole) => void;
}

const normalizeParticipant = (participant: SharedParticipant): Participant => ({
  ...participant,
  cursorX: participant.cursorX ?? 0,
  cursorY: participant.cursorY ?? 0
});

export const useWhiteboardRealtime = ({
  boardId,
  displayName,
  role,
  editorAccessKey,
  initialBoard,
  onEditorRequestDenied
}: UseWhiteboardRealtimeOptions): {
  sessionId: string;
  currentRole: AccessRole;
  isReadOnly: boolean;
  updateTitle: (nextTitle: string) => void;
  addShape: (shape: WhiteboardShape) => void;
  patchShape: (shapeId: string, patch: Partial<WhiteboardShape>) => void;
  removeShape: (shapeId: string) => void;
  sendCursor: (x: number, y: number) => void;
  undo: () => void;
  redo: () => void;
} => {
  const title = useWhiteboardStore.use.title();
  const version = useWhiteboardStore.use.version();
  const currentRole = useWhiteboardStore.use.role();

  const resetBoard = useWhiteboardStore.use.resetBoard();
  const hydrateBoard = useWhiteboardStore.use.hydrateBoard();
  const setTitleLocal = useWhiteboardStore.use.setTitleLocal();
  const setRole = useWhiteboardStore.use.setRole();
  const upsertShapeLocal = useWhiteboardStore.use.upsertShapeLocal();
  const patchShapeLocal = useWhiteboardStore.use.patchShapeLocal();
  const removeShapeLocal = useWhiteboardStore.use.removeShapeLocal();
  const setParticipants = useWhiteboardStore.use.setParticipants();
  const upsertParticipant = useWhiteboardStore.use.upsertParticipant();
  const setConnection = useWhiteboardStore.use.setConnection();
  const setConflictMessage = useWhiteboardStore.use.setConflictMessage();
  const pushEvent = useWhiteboardStore.use.pushEvent();

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
  const versionRef = useRef<number>(initialBoard?.version ?? 0);
  const titleRef = useRef<string>(initialBoard?.title ?? "화이트보드");
  const cursorSentAtRef = useRef<number>(0);
  const shapeEmitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  if (!sessionIdRef.current && typeof window !== "undefined") {
    sessionIdRef.current = getOrCreateSessionId();
    sessionTokenRef.current = getStoredSessionToken() ?? "";
  }

  useEffect(() => {
    requestedRoleRef.current = role;
  }, [role]);

  useEffect(() => {
    displayNameRef.current = displayName;
  }, [displayName]);

  useEffect(() => {
    const normalized = editorAccessKey?.trim();
    editorAccessKeyRef.current = normalized && normalized.length > 0 ? normalized : undefined;
  }, [editorAccessKey]);

  useEffect(() => {
    onEditorRequestDeniedRef.current = onEditorRequestDenied;
  }, [onEditorRequestDenied]);

  const emitBoardJoin = useCallback(
    (targetSocket?: Socket | null) => {
      const socket = targetSocket ?? socketRef.current;
      if (!socket || !socket.connected || !boardId) {
        return;
      }

      const payload: BoardJoinPayload = {
        boardId,
        sessionId: sessionIdRef.current,
        sessionToken: sessionTokenRef.current || undefined,
        displayName: displayNameRef.current.trim() || createGuestName(),
        role: requestedRoleRef.current,
        editorAccessKey: editorAccessKeyRef.current ?? getStoredEditorAccessKey() ?? undefined
      };
      socket.emit(socketEventName.boardJoin, payload);
    },
    [boardId]
  );

  useEffect(() => {
    if (!boardId) {
      return;
    }

    resetBoard(boardId, initialBoard ?? null);
    setRole(roleRef.current);

    if (initialBoard) {
      versionRef.current = initialBoard.version;
      titleRef.current = initialBoard.title;
    }
  }, [boardId, initialBoard, resetBoard, setRole]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  useEffect(() => {
    if (!boardId) {
      return;
    }

    const shapeEmitTimers = shapeEmitTimersRef.current;
    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
      reconnection: true
    });

    socketRef.current = socket;
    setConnection("connecting");

    socket.on("connect", () => {
      setConnection("online");
      setConflictMessage(null);
      pushEvent("화이트보드 실시간 연결이 활성화되었습니다.");
      emitBoardJoin(socket);
    });

    socket.on("disconnect", () => {
      setConnection("offline");
      pushEvent("연결이 끊어졌습니다. 재연결 대기 중입니다.");
    });

    socket.on("connect_error", () => {
      setConnection("offline");
      pushEvent("서버 연결 실패. 자동 재시도 중입니다.");
    });

    socket.on(
      socketEventName.boardState,
      ({ board, role: nextRole, sessionId, sessionToken }: BoardStatePayload) => {
        if (typeof sessionId === "string" && typeof sessionToken === "string") {
          sessionIdRef.current = sessionId;
          sessionTokenRef.current = sessionToken;
          setStoredSessionIdentity(sessionId, sessionToken);
        }

        roleRef.current = nextRole;
        hydrateBoard(board, nextRole);
        versionRef.current = board.version;
        titleRef.current = board.title;
        setConflictMessage(null);
        pushEvent(`보드 최신 상태를 수신했습니다. (권한: ${nextRole})`);
      }
    );

    socket.on(socketEventName.boardUpdate, ({ board, editor }: BoardUpdatePayload) => {
      hydrateBoard(board);
      versionRef.current = board.version;
      titleRef.current = board.title;
      if (editor && editor.sessionId !== sessionIdRef.current) {
        pushEvent(`${editor.displayName} 님의 변경사항이 반영되었습니다.`);
      }
    });

    socket.on(
      socketEventName.participantsUpdate,
      ({ boardId: incomingBoardId, participants }: BoardParticipantsPayload) => {
        if (incomingBoardId !== boardId) {
          return;
        }

        setParticipants(participants.map(normalizeParticipant));
      }
    );

    socket.on(
      socketEventName.boardCursorUpdate,
      ({ boardId: incomingBoardId, participant }: BoardCursorUpdatePayload) => {
        if (incomingBoardId !== boardId) {
          return;
        }

        upsertParticipant(normalizeParticipant(participant));
      }
    );

    socket.on(
      socketEventName.boardConflict,
      ({ boardId: incomingBoardId, serverVersion }: BoardConflictPayload) => {
        if (incomingBoardId !== boardId) {
          return;
        }

        setConflictMessage(
          `동시 수정 충돌이 발생해 서버 기준(last-write-wins)으로 정리되었습니다. (서버 버전 ${serverVersion})`
        );
        pushEvent("충돌이 감지되어 서버 기준으로 반영되었습니다.");
      }
    );

    socket.on(
      socketEventName.permissionDenied,
      ({ scope, currentRole: deniedRole }: PermissionDeniedPayload) => {
        if (scope !== "board") {
          return;
        }

        const wasRequestingEditor = requestedRoleRef.current === "editor";
        roleRef.current = deniedRole;
        setRole(deniedRole);
        pushEvent("읽기 전용 권한으로 전환되어 편집이 제한됩니다.");

        if (wasRequestingEditor && deniedRole !== "editor") {
          requestedRoleRef.current = deniedRole;
          editorAccessKeyRef.current = undefined;
          onEditorRequestDeniedRef.current?.(deniedRole);
        }
      }
    );

    socket.on(socketEventName.socketError, ({ message }: SocketErrorPayload) => {
      if (message) {
        pushEvent(message);
      }
    });

    return () => {
      for (const timer of shapeEmitTimers.values()) {
        clearTimeout(timer);
      }
      shapeEmitTimers.clear();

      socket.disconnect();
      socketRef.current = null;
      setParticipants([]);
      setConnection("offline");
    };
  }, [
    boardId,
    emitBoardJoin,
    hydrateBoard,
    pushEvent,
    setConflictMessage,
    setConnection,
    setParticipants,
    setRole,
    upsertParticipant
  ]);

  useEffect(() => {
    if (!boardId) {
      return;
    }

    const timer = setTimeout(() => {
      emitBoardJoin();
    }, 180);

    return () => {
      clearTimeout(timer);
    };
  }, [boardId, displayName, role, editorAccessKey, emitBoardJoin]);

  const updateTitle = useCallback(
    (nextTitle: string) => {
      const normalized = nextTitle.slice(0, 120);
      if (roleRef.current !== "editor") {
        return;
      }

      setTitleLocal(normalized);
      titleRef.current = normalized;

      // 입력 중 임시 빈 값으로 서버 제목을 덮어쓰지 않도록 방지합니다.
      if (normalized.trim().length === 0) {
        return;
      }

      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        return;
      }

      const payload: BoardTitlePayload = {
        boardId,
        title: normalized,
        baseVersion: versionRef.current
      };
      socket.emit(socketEventName.boardTitleUpdate, payload);
    },
    [boardId, setTitleLocal]
  );

  const addShape = useCallback(
    (shape: WhiteboardShape) => {
      if (roleRef.current !== "editor") {
        return;
      }

      upsertShapeLocal(shape);

      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        return;
      }

      const payload: BoardAddShapePayload = {
        boardId,
        shape,
        baseVersion: versionRef.current
      };
      socket.emit(socketEventName.boardShapeAdd, payload);
    },
    [boardId, upsertShapeLocal]
  );

  const patchShape = useCallback(
    (shapeId: string, patch: Partial<WhiteboardShape>) => {
      if (roleRef.current !== "editor") {
        return;
      }

      patchShapeLocal(shapeId, patch);

      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        return;
      }

      const pending = shapeEmitTimersRef.current.get(shapeId);
      if (pending) {
        clearTimeout(pending);
      }

      const timer = setTimeout(() => {
        const payload: BoardPatchShapePayload = {
          boardId,
          shapeId,
          patch,
          baseVersion: versionRef.current
        };
        socket.emit(socketEventName.boardShapeUpdate, payload);

        shapeEmitTimersRef.current.delete(shapeId);
      }, 48);

      shapeEmitTimersRef.current.set(shapeId, timer);
    },
    [boardId, patchShapeLocal]
  );

  const removeShape = useCallback(
    (shapeId: string) => {
      if (roleRef.current !== "editor") {
        return;
      }

      removeShapeLocal(shapeId);

      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        return;
      }

      const payload: BoardRemoveShapePayload = {
        boardId,
        shapeId,
        baseVersion: versionRef.current
      };
      socket.emit(socketEventName.boardShapeRemove, payload);
    },
    [boardId, removeShapeLocal]
  );

  const sendCursor = useCallback(
    (x: number, y: number) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        return;
      }

      const now = Date.now();
      if (now - cursorSentAtRef.current < 50) {
        return;
      }

      cursorSentAtRef.current = now;
      const payload: BoardCursorPayload = { boardId, x, y };
      socket.emit(socketEventName.boardCursor, payload);
    },
    [boardId]
  );

  const undo = useCallback(() => {
    if (roleRef.current !== "editor") {
      return;
    }

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      return;
    }

    const payload: BoardUndoPayload = {
      boardId,
      baseVersion: versionRef.current
    };
    socket.emit(socketEventName.boardUndo, payload);
  }, [boardId]);

  const redo = useCallback(() => {
    if (roleRef.current !== "editor") {
      return;
    }

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      return;
    }

    const payload: BoardRedoPayload = {
      boardId,
      baseVersion: versionRef.current
    };
    socket.emit(socketEventName.boardRedo, payload);
  }, [boardId]);

  return {
    sessionId: sessionIdRef.current,
    currentRole,
    isReadOnly: currentRole !== "editor",
    updateTitle,
    addShape,
    patchShape,
    removeShape,
    sendCursor,
    undo,
    redo
  };
};
