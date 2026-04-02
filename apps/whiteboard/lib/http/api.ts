import { WhiteboardRecord, WhiteboardSummary } from "@/lib/collab";
import { whiteboardClientEnv } from "@/lib/config";
import { createResourceClient, requestJson } from "@repo/react-query";

export const API_BASE_URL = whiteboardClientEnv.apiBaseUrl;
export const whiteboardQueryKeys = {
  all: ["whiteboard"] as const,
  boards: () => [...whiteboardQueryKeys.all, "boards"] as const,
  board: (boardId: string) => [...whiteboardQueryKeys.all, "board", boardId] as const
};

const boardsResource = createResourceClient<
  WhiteboardSummary,
  WhiteboardRecord,
  "boards",
  "board",
  "boardId"
>(
  API_BASE_URL,
  "/api/boards",
  {
    list: "boards",
    item: "board",
    deleteId: "boardId"
  }
);

export const listBoards = async (): Promise<WhiteboardSummary[]> => {
  return boardsResource.list();
};

export const createBoard = async (input: {
  title: string;
  actor: string;
  editorAccessKey?: string;
}): Promise<{ board: WhiteboardRecord }> => {
  return requestJson<{ board: WhiteboardRecord }>(API_BASE_URL, "/api/boards", {
    method: "POST",
    body: JSON.stringify(input),
    successMessage: "화이트보드가 생성되었습니다."
  });
};

export const deleteBoardById = async (input: {
  boardId: string;
  editorAccessKey?: string;
  notifyOnError?: boolean;
}): Promise<{ ok: true; boardId: string }> => {
  return requestJson<{ ok: true; boardId: string }>(API_BASE_URL, `/api/boards/${input.boardId}`, {
    method: "DELETE",
    body: JSON.stringify({
      editorAccessKey: input.editorAccessKey
    }),
    notifyOnError: input.notifyOnError,
    successMessage: "화이트보드가 삭제되었습니다."
  });
};

export const getBoard = async (boardId: string): Promise<{ board: WhiteboardRecord }> => {
  return boardsResource.getById(boardId);
};
