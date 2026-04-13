import { WhiteboardRecord, WhiteboardSummary } from "@/features/whiteboard/collaboration/model";
import { whiteboardClientEnv } from "@/lib/config";
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
>(API_BASE_URL, "/api/boards", {
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
    successMessage: "화이트보드가 생성되었습니다."
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
      successMessage: "화이트보드가 삭제되었습니다."
    }
  );
};

export const getBoard = async (boardId: string): Promise<{ board: WhiteboardRecord }> => {
  return boardsResource.getById(boardId);
};
