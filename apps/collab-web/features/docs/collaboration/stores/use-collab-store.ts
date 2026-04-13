import { createAppStore, createSelectors } from "@repo/zustand";
import { appendEventLog } from "@repo/utils/collab";
import {
  AccessRole,
  ConnectionState,
  DocumentComment,
  DocumentRecord,
  Participant,
  SaveState
} from "@/features/docs/collaboration/model";

interface CollabStore {
  activeDocumentId: string | null;
  role: AccessRole;
  title: string;
  content: string;
  version: number;
  updatedAt: string | null;
  participants: Participant[];
  comments: DocumentComment[];
  connection: ConnectionState;
  saveState: SaveState;
  conflictMessage: string | null;
  eventLog: string[];
  resetForDocument: (documentId: string, seed?: DocumentRecord | null) => void;
  hydrateFromServer: (document: DocumentRecord, role: AccessRole, comments: DocumentComment[]) => void;
  setRole: (role: AccessRole) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setDocumentSnapshot: (title: string, content: string) => void;
  setParticipants: (participants: Participant[]) => void;
  upsertParticipant: (participant: Participant) => void;
  setComments: (comments: DocumentComment[]) => void;
  addComment: (comment: DocumentComment) => void;
  updateComment: (comment: DocumentComment) => void;
  removeComment: (commentId: string) => void;
  setConnection: (state: ConnectionState) => void;
  setSaveState: (state: SaveState) => void;
  markSavedCheckpoint: (updatedAt: string, version: number) => void;
  setConflictMessage: (message: string | null) => void;
  pushEvent: (message: string) => void;
}

const MAX_LOG = 24;

const normalizeParticipant = (participant: Participant): Participant => ({
  ...participant,
  cursorIndex: participant.cursorIndex ?? 0
});

const sortParticipants = (participants: Participant[]): Participant[] => {
  return [...participants]
    .map(normalizeParticipant)
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "ko"));
};

const collabStore = createAppStore<CollabStore>(
  (set, get) => ({
    activeDocumentId: null,
    role: "editor",
    title: "",
    content: "",
    version: 0,
    updatedAt: null,
    participants: [],
    comments: [],
    connection: "offline",
    saveState: "idle",
    conflictMessage: null,
    eventLog: [],
    resetForDocument: (documentId, seed) => {
      set({
        activeDocumentId: documentId,
        role: "editor",
        title: seed?.title ?? "(제목 없음)",
        content: seed?.content ?? "",
        version: seed?.version ?? 0,
        updatedAt: seed?.updatedAt ?? null,
        participants: [],
        comments: seed?.comments ?? [],
        connection: "connecting",
        saveState: "idle",
        conflictMessage: null,
        eventLog: []
      });
    },
    hydrateFromServer: (document, role, comments) => {
      set((state) => ({
        role,
        title: document.title,
        content: document.content,
        version: Math.max(state.version, document.version),
        updatedAt: document.updatedAt,
        comments,
        saveState: "saved"
      }));
    },
    setRole: (role) => {
      set({ role });
    },
    setTitle: (title) => {
      set((state) => (state.title === title ? state : { title }));
    },
    setContent: (content) => {
      set((state) => (state.content === content ? state : { content }));
    },
    setDocumentSnapshot: (title, content) => {
      set((state) => {
        if (state.title === title && state.content === content) {
          return state;
        }

        return {
          title,
          content
        };
      });
    },
    setParticipants: (participants) => {
      set({ participants: sortParticipants(participants) });
    },
    upsertParticipant: (participant) => {
      set((state) => {
        const normalized = normalizeParticipant(participant);
        const existingIndex = state.participants.findIndex((item) => item.sessionId === normalized.sessionId);

        if (existingIndex === -1) {
          return {
            participants: sortParticipants([...state.participants, normalized])
          };
        }

        const nextParticipants = [...state.participants];
        nextParticipants[existingIndex] = normalized;

        return {
          participants: nextParticipants
        };
      });
    },
    setComments: (comments) => {
      set({ comments });
    },
    addComment: (comment) => {
      set((state) => ({
        comments: [comment, ...state.comments.filter((item) => item.id !== comment.id)]
      }));
    },
    updateComment: (comment) => {
      set((state) => ({
        comments: state.comments.map((existingComment) =>
          existingComment.id === comment.id ? comment : existingComment
        )
      }));
    },
    removeComment: (commentId) => {
      set((state) => ({
        comments: state.comments.filter((comment) => comment.id !== commentId)
      }));
    },
    setConnection: (state) => {
      set({ connection: state });
    },
    setSaveState: (state) => {
      set({ saveState: state });
    },
    markSavedCheckpoint: (updatedAt, version) => {
      set((state) => ({
        updatedAt,
        version: Math.max(state.version, version),
        saveState: "saved"
      }));
    },
    setConflictMessage: (message) => {
      set({ conflictMessage: message });
    },
    pushEvent: (message) => {
      set({ eventLog: appendEventLog(get().eventLog, message, MAX_LOG) });
    }
  }),
  { name: "docs-collab-store" }
);

export const useCollabStore = createSelectors(collabStore);
