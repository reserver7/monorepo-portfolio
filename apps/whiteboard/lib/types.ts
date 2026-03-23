import type {
  AccessRole,
  ConnectionState,
  Participant as SharedParticipant,
  WhiteboardRecord,
  WhiteboardShape,
  WhiteboardSummary
} from "@repo/shared-types";

export type { AccessRole, ConnectionState, WhiteboardRecord, WhiteboardShape, WhiteboardSummary };

export interface Participant extends Omit<SharedParticipant, "cursorX" | "cursorY"> {
  cursorX: number;
  cursorY: number;
}
