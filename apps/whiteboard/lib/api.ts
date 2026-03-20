import { WhiteboardRecord, WhiteboardSummary } from "@/lib/types";
import { whiteboardClientEnv } from "@/lib/env";
import { requestJson } from "@repo/shared-client";

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
}): Promise<{ board: WhiteboardRecord }> => {
  return requestJson<{ board: WhiteboardRecord }>(API_BASE_URL, "/api/boards", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const getBoard = async (boardId: string): Promise<{ board: WhiteboardRecord }> => {
  return requestJson<{ board: WhiteboardRecord }>(API_BASE_URL, `/api/boards/${boardId}`, {
    method: "GET"
  });
};
