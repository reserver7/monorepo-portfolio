import { WhiteboardRecord, WhiteboardSummary } from "@/features/whiteboard/collaboration/model";
import type { WorkspaceMember } from "@repo/utils/collab";
import { whiteboardClientEnv } from "@/lib/config";
import { getCollabText } from "@/lib/i18n/runtime";
import { createQueryKeys, createResourceClient } from "@repo/react-query";

export const API_BASE_URL = whiteboardClientEnv.apiBaseUrl;
const whiteboardKeysBase = createQueryKeys("whiteboard");

export const whiteboardQueryKeys = {
  all: whiteboardKeysBase.all,
  boards: () => whiteboardKeysBase.lists(),
  board: (boardId: string) => whiteboardKeysBase.detail(boardId)
};

const boardsResource = createResourceClient<
  WhiteboardSummary,
  WhiteboardRecord,
  "boards",
  "board",
  "boardId"
>("", "/api/workspace/boards", {
  list: "boards",
  item: "board",
  deleteId: "boardId"
});

export const listBoards = async (): Promise<WhiteboardSummary[]> => {
  return boardsResource.list();
};

export const createBoard = async (input: {
  title: string;
  actor: string;
  editorAccessKey?: string;
}): Promise<{ board: WhiteboardRecord }> => {
  return boardsResource.create(input, {
    successMessage: getCollabText("collab.api.whiteboard.createSuccess")
  });
};

export const deleteBoardById = async (input: {
  boardId: string;
  editorAccessKey?: string;
  notifyOnError?: boolean;
}): Promise<{ ok: true; boardId: string }> => {
  return boardsResource.deleteById(
    input.boardId,
    {
      editorAccessKey: input.editorAccessKey
    },
    {
      notifyOnError: input.notifyOnError,
      successMessage: getCollabText("collab.api.whiteboard.deleteSuccess")
    }
  );
};

export const getBoard = async (
  boardId: string
): Promise<{
  board: WhiteboardRecord;
  permission?: "owner" | "viewer" | "editor" | "legacy";
}> => {
  return boardsResource.getById(boardId);
};

export const listBoardMembers = async (boardId: string): Promise<{ members: WorkspaceMember[] }> =>
  fetch(`/api/workspace/boards/${boardId}/members`, { credentials: "include" }).then((response) =>
    response.json()
  );

export const upsertBoardMember = async (input: {
  boardId: string;
  email: string;
  role: "viewer" | "editor";
}): Promise<{ member: WorkspaceMember }> =>
  fetch(`/api/workspace/boards/${input.boardId}/members`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: input.email, role: input.role })
  }).then((response) => response.json());

export const removeBoardMember = async (input: {
  boardId: string;
  email: string;
}): Promise<{ member: WorkspaceMember }> =>
  fetch(`/api/workspace/boards/${input.boardId}/members?email=${encodeURIComponent(input.email)}`, {
    method: "DELETE",
    credentials: "include"
  }).then((response) => response.json());
