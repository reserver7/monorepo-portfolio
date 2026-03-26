import { WhiteboardRecord, WhiteboardSummary } from "@/lib/collab";
import { whiteboardClientEnv } from "@/lib/config";
import { requestJson } from "@repo/http";

export const API_BASE_URL = whiteboardClientEnv.apiBaseUrl;

export const listBoards = async (): Promise<WhiteboardSummary[]> => {
  const payload = await requestJson<{ boards: WhiteboardSummary[] }>(API_BASE_URL, "/api/boards", {
    method: "GET"
  });
  return payload.boards;
};

export const createBoard = async (input: {
  title: string;
  actor: string;
  editorAccessKey?: string;
}): Promise<{ board: WhiteboardRecord }> => {
  return requestJson<{ board: WhiteboardRecord }>(API_BASE_URL, "/api/boards", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const deleteBoardById = async (input: {
  boardId: string;
  editorAccessKey?: string;
}): Promise<{ ok: true; boardId: string }> => {
  return requestJson<{ ok: true; boardId: string }>(API_BASE_URL, `/api/boards/${input.boardId}`, {
    method: "DELETE",
    body: JSON.stringify({
      editorAccessKey: input.editorAccessKey
    })
  });
};

export const getBoard = async (boardId: string): Promise<{ board: WhiteboardRecord }> => {
  return requestJson<{ board: WhiteboardRecord }>(API_BASE_URL, `/api/boards/${boardId}`, {
    method: "GET"
  });
};
