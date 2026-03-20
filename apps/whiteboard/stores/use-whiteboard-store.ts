import { create } from "zustand";
import { AccessRole, ConnectionState, Participant, WhiteboardRecord, WhiteboardShape } from "@/lib/types";

interface WhiteboardStore {
  activeBoardId: string | null;
  role: AccessRole;
  title: string;
  shapes: WhiteboardShape[];
  version: number;
  updatedAt: string | null;
  participants: Participant[];
  connection: ConnectionState;
  conflictMessage: string | null;
  eventLog: string[];
  resetBoard: (boardId: string, seed?: WhiteboardRecord | null) => void;
  hydrateBoard: (board: WhiteboardRecord, role?: AccessRole) => void;
  setRole: (role: AccessRole) => void;
  setTitleLocal: (title: string) => void;
  upsertShapeLocal: (shape: WhiteboardShape) => void;
  patchShapeLocal: (shapeId: string, patch: Partial<WhiteboardShape>) => void;
  removeShapeLocal: (shapeId: string) => void;
  setParticipants: (participants: Participant[]) => void;
  upsertParticipant: (participant: Participant) => void;
  setConnection: (connection: ConnectionState) => void;
  setConflictMessage: (message: string | null) => void;
  pushEvent: (message: string) => void;
}

const MAX_LOG = 36;

const toLogLine = (message: string): string => {
  const timestamp = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());

  return `${timestamp} · ${message}`;
};

export const useWhiteboardStore = create<WhiteboardStore>((set, get) => ({
  activeBoardId: null,
  role: "editor",
  title: "",
  shapes: [],
  version: 0,
  updatedAt: null,
  participants: [],
  connection: "offline",
  conflictMessage: null,
  eventLog: [],
  resetBoard: (boardId, seed) => {
    set({
      activeBoardId: boardId,
      role: "editor",
      title: seed?.title ?? "화이트보드",
      shapes: seed?.shapes ?? [],
      version: seed?.version ?? 0,
      updatedAt: seed?.updatedAt ?? null,
      participants: [],
      connection: "connecting",
      conflictMessage: null,
      eventLog: []
    });
  },
  hydrateBoard: (board, role) => {
    set((state) => {
      if (board.version < state.version) {
        if (role) {
          return { ...state, role };
        }

        return state;
      }

      return {
        role: role ?? state.role,
        title: board.title,
        shapes: board.shapes,
        version: board.version,
        updatedAt: board.updatedAt
      };
    });
  },
  setRole: (role) => {
    set({ role });
  },
  setTitleLocal: (title) => {
    set({ title });
  },
  upsertShapeLocal: (shape) => {
    set((state) => {
      const index = state.shapes.findIndex((item) => item.id === shape.id);
      if (index === -1) {
        return { shapes: [...state.shapes, shape] };
      }

      const next = [...state.shapes];
      next[index] = shape;
      return { shapes: next };
    });
  },
  patchShapeLocal: (shapeId, patch) => {
    set((state) => ({
      shapes: state.shapes.map((shape) =>
        shape.id === shapeId ? { ...shape, ...patch, updatedAt: new Date().toISOString() } : shape
      )
    }));
  },
  removeShapeLocal: (shapeId) => {
    set((state) => ({
      shapes: state.shapes.filter((shape) => shape.id !== shapeId)
    }));
  },
  setParticipants: (participants) => {
    const normalized = participants.map((item) => ({
      ...item,
      cursorX: item.cursorX ?? 0,
      cursorY: item.cursorY ?? 0
    }));
    set({ participants: normalized });
  },
  upsertParticipant: (participant) => {
    set((state) => {
      const normalized = {
        ...participant,
        cursorX: participant.cursorX ?? 0,
        cursorY: participant.cursorY ?? 0
      };
      const index = state.participants.findIndex((item) => item.sessionId === normalized.sessionId);
      if (index === -1) {
        return { participants: [...state.participants, normalized] };
      }

      const next = [...state.participants];
      next[index] = normalized;
      return { participants: next };
    });
  },
  setConnection: (connection) => {
    set({ connection });
  },
  setConflictMessage: (message) => {
    set({ conflictMessage: message });
  },
  pushEvent: (message) => {
    const existing = get().eventLog;
    set({ eventLog: [toLogLine(message), ...existing].slice(0, MAX_LOG) });
  }
}));
