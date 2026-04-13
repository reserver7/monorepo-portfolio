import { createAppStore, createSelectors } from "@repo/zustand";
import { appendEventLog } from "@repo/utils/collab";
import { AccessRole, ConnectionState, Participant, WhiteboardRecord, WhiteboardShape } from "@/features/whiteboard/collaboration/model";

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

const normalizeParticipant = (participant: Participant): Participant => ({
  ...participant,
  cursorX: participant.cursorX ?? 0,
  cursorY: participant.cursorY ?? 0
});

const whiteboardStore = createAppStore<WhiteboardStore>(
  (set, get) => ({
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
      set((state) => {
        const index = state.shapes.findIndex((shape) => shape.id === shapeId);
        if (index === -1) {
          return state;
        }

        const currentShape = state.shapes[index];
        if (!currentShape) {
          return state;
        }

        let hasChanged = false;

        for (const key in patch) {
          const typedKey = key as keyof WhiteboardShape;
          const nextValue = patch[typedKey];
          if (nextValue !== undefined && currentShape[typedKey] !== nextValue) {
            hasChanged = true;
            break;
          }
        }

        if (!hasChanged) {
          return state;
        }

        const nextShapes = [...state.shapes];
        const nextShape: WhiteboardShape = {
          ...currentShape,
          updatedAt: new Date().toISOString()
        };

        for (const key in patch) {
          const typedKey = key as keyof WhiteboardShape;
          const nextValue = patch[typedKey];
          if (nextValue !== undefined) {
            (nextShape[typedKey] as WhiteboardShape[keyof WhiteboardShape]) = nextValue;
          }
        }

        nextShapes[index] = nextShape;

        return { shapes: nextShapes };
      });
    },
    removeShapeLocal: (shapeId) => {
      set((state) => ({
        shapes: state.shapes.filter((shape) => shape.id !== shapeId)
      }));
    },
    setParticipants: (participants) => {
      set({ participants: participants.map(normalizeParticipant) });
    },
    upsertParticipant: (participant) => {
      set((state) => {
        const normalized = normalizeParticipant(participant);
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
      set({ eventLog: appendEventLog(get().eventLog, message, MAX_LOG) });
    }
  }),
  { name: "whiteboard-store" }
);

export const useWhiteboardStore = createSelectors(whiteboardStore);
