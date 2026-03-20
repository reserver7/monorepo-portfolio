import type {
  AccessRole,
  ConnectionState,
  DocumentComment,
  DocumentRecord,
  DocumentSummary,
  EditorSnapshot,
  HistoryEntry,
  Participant as SharedParticipant,
  SaveState
} from "@repo/shared-types";

export type {
  AccessRole,
  ConnectionState,
  DocumentComment,
  DocumentRecord,
  DocumentSummary,
  EditorSnapshot,
  HistoryEntry,
  SaveState
};

export interface Participant extends SharedParticipant {
  cursorIndex: number;
}

export interface RealtimeYjsUpdate {
  documentId: string;
  encodedUpdate: string;
  version: number;
  updatedAt: string;
  title: string;
  editor: EditorSnapshot | null;
}

export interface RealtimeDocumentUpdate {
  documentId: string;
  title: string;
  content: string;
  version: number;
  updatedAt: string;
  editor: EditorSnapshot | null;
}
