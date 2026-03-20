"use client";

import { useCallback, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";
import {
  getOrCreateSessionId,
  getStoredEditorAccessKey,
  getStoredSessionToken,
  setStoredSessionIdentity
} from "@/lib/session";
import { AccessRole, Participant, WhiteboardRecord, WhiteboardShape } from "@/lib/types";
import { useWhiteboardStore } from "@/stores/use-whiteboard-store";

interface UseWhiteboardRealtimeOptions {
  boardId: string;
  displayName: string;
  role: AccessRole;
  editorAccessKey?: string | null;
  initialBoard?: WhiteboardRecord | null;
}

interface BoardStatePayload {
  board: WhiteboardRecord;
  role: AccessRole;
  sessionId?: string;
  sessionToken?: string;
  sessionTrusted?: boolean;
}

interface BoardUpdatePayload {
  board: WhiteboardRecord;
  editor?: {
    sessionId: string;
    displayName: string;
    color: string;
  } | null;
}

interface ParticipantsPayload {
  boardId: string;
  participants: Participant[];
}

interface CursorPayload {
  boardId: string;
  participant: Participant;
}

interface ConflictPayload {
  boardId: string;
  serverVersion: number;
}

interface PermissionDeniedPayload {
  scope: "document" | "board";
  requiredRole: AccessRole;
  currentRole: AccessRole;
}

export const useWhiteboardRealtime = ({
  boardId,
  displayName,
  role,
  editorAccessKey,
  initialBoard
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
  const title = useWhiteboardStore((state) => state.title);
  const version = useWhiteboardStore((state) => state.version);
  const currentRole = useWhiteboardStore((state) => state.role);

  const resetBoard = useWhiteboardStore((state) => state.resetBoard);
  const hydrateBoard = useWhiteboardStore((state) => state.hydrateBoard);
  const setTitleLocal = useWhiteboardStore((state) => state.setTitleLocal);
  const setRole = useWhiteboardStore((state) => state.setRole);
  const upsertShapeLocal = useWhiteboardStore((state) => state.upsertShapeLocal);
  const patchShapeLocal = useWhiteboardStore((state) => state.patchShapeLocal);
  const removeShapeLocal = useWhiteboardStore((state) => state.removeShapeLocal);
  const setParticipants = useWhiteboardStore((state) => state.setParticipants);
  const upsertParticipant = useWhiteboardStore((state) => state.upsertParticipant);
  const setConnection = useWhiteboardStore((state) => state.setConnection);
  const setConflictMessage = useWhiteboardStore((state) => state.setConflictMessage);
  const pushEvent = useWhiteboardStore((state) => state.pushEvent);

  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string>("");
  const sessionTokenRef = useRef<string>("");
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
    roleRef.current = role;
    setRole(role);
  }, [role, setRole]);

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
    if (!boardId || !displayName) {
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

      socket.emit("board:join", {
        boardId,
        sessionId: sessionIdRef.current,
        sessionToken: sessionTokenRef.current || undefined,
        displayName,
        role: roleRef.current,
        editorAccessKey: editorAccessKey ?? getStoredEditorAccessKey() ?? undefined
      });
    });

    socket.on("disconnect", () => {
      setConnection("offline");
      pushEvent("연결이 끊어졌습니다. 재연결 대기 중입니다.");
    });

    socket.on("connect_error", () => {
      setConnection("offline");
      pushEvent("서버 연결 실패. 자동 재시도 중입니다.");
    });

    socket.on("board:state", ({ board, role: nextRole, sessionId, sessionToken }: BoardStatePayload) => {
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
    });

    socket.on("board:update", ({ board, editor }: BoardUpdatePayload) => {
      hydrateBoard(board);
      versionRef.current = board.version;
      titleRef.current = board.title;
      if (editor && editor.sessionId !== sessionIdRef.current) {
        pushEvent(`${editor.displayName} 님의 변경사항이 반영되었습니다.`);
      }
    });

    socket.on("participants:update", ({ boardId: incomingBoardId, participants }: ParticipantsPayload) => {
      if (incomingBoardId !== boardId) {
        return;
      }

      setParticipants(participants);
    });

    socket.on("board:cursor:update", ({ boardId: incomingBoardId, participant }: CursorPayload) => {
      if (incomingBoardId !== boardId) {
        return;
      }

      upsertParticipant(participant);
    });

    socket.on("board:conflict", ({ serverVersion }: ConflictPayload) => {
      setConflictMessage(
        `동시 수정 충돌이 발생해 서버 기준(last-write-wins)으로 정리되었습니다. (서버 버전 ${serverVersion})`
      );
      pushEvent("충돌이 감지되어 서버 기준으로 반영되었습니다.");
    });

    socket.on("permission:denied", ({ scope, currentRole: deniedRole }: PermissionDeniedPayload) => {
      if (scope !== "board") {
        return;
      }

      roleRef.current = deniedRole;
      setRole(deniedRole);
      pushEvent("읽기 전용 권한으로 전환되어 편집이 제한됩니다.");
    });

    socket.on("error", ({ message }: { message?: string }) => {
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
    displayName,
    hydrateBoard,
    pushEvent,
    setConflictMessage,
    setConnection,
    setParticipants,
    setRole,
    upsertParticipant,
    editorAccessKey
  ]);

  const updateTitle = useCallback(
    (nextTitle: string) => {
      const normalized = nextTitle.trim() || "Untitled board";
      if (roleRef.current !== "editor") {
        return;
      }

      setTitleLocal(normalized);
      titleRef.current = normalized;

      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        return;
      }

      socket.emit("board:title:update", {
        boardId,
        title: normalized,
        baseVersion: versionRef.current
      });
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

      socket.emit("board:shape:add", {
        boardId,
        shape,
        baseVersion: versionRef.current
      });
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
        socket.emit("board:shape:update", {
          boardId,
          shapeId,
          patch,
          baseVersion: versionRef.current
        });

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

      socket.emit("board:shape:remove", {
        boardId,
        shapeId,
        baseVersion: versionRef.current
      });
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
      socket.emit("board:cursor", { boardId, x, y });
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

    socket.emit("board:undo", {
      boardId,
      baseVersion: versionRef.current
    });
  }, [boardId]);

  const redo = useCallback(() => {
    if (roleRef.current !== "editor") {
      return;
    }

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      return;
    }

    socket.emit("board:redo", {
      boardId,
      baseVersion: versionRef.current
    });
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
