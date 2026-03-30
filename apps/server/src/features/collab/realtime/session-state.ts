import type { AccessRole, Participant } from "@repo/utils/collab/server";

export interface RealtimeSessionState {
  documentParticipants: Map<string, Map<string, Participant>>;
  boardParticipants: Map<string, Map<string, Participant>>;
  documentBySocket: Map<string, string>;
  boardBySocket: Map<string, string>;
  documentRolesBySession: Map<string, Map<string, AccessRole>>;
  boardRolesBySession: Map<string, Map<string, AccessRole>>;
}

export const createRealtimeSessionState = (): RealtimeSessionState => {
  return {
    documentParticipants: new Map<string, Map<string, Participant>>(),
    boardParticipants: new Map<string, Map<string, Participant>>(),
    documentBySocket: new Map<string, string>(),
    boardBySocket: new Map<string, string>(),
    documentRolesBySession: new Map<string, Map<string, AccessRole>>(),
    boardRolesBySession: new Map<string, Map<string, AccessRole>>()
  };
};

export const documentRoom = (documentId: string): string => `document:${documentId}`;
export const boardRoom = (boardId: string): string => `board:${boardId}`;
