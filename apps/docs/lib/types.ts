import type {
  AccessRole,
  ConnectionState,
  DocumentComment,
  DocumentRecord,
  DocumentSummary,
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
  HistoryEntry,
  SaveState
};

export interface Participant extends Omit<SharedParticipant, "cursorIndex"> {
  cursorIndex: number;
}
