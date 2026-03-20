import { WhiteboardRecord, WhiteboardSummary } from "@/lib/types";
import { whiteboardClientEnv } from "@/lib/env";

export const API_BASE_URL = whiteboardClientEnv.apiBaseUrl;

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as T;
};

export const listBoards = async (): Promise<WhiteboardSummary[]> => {
  const payload = await request<{ boards: WhiteboardSummary[] }>("/api/boards", { method: "GET" });
  return payload.boards;
};

export const createBoard = async (input: {
  title: string;
  actor: string;
}): Promise<{ board: WhiteboardRecord }> => {
  return request<{ board: WhiteboardRecord }>("/api/boards", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const getBoard = async (boardId: string): Promise<{ board: WhiteboardRecord }> => {
  return request<{ board: WhiteboardRecord }>(`/api/boards/${boardId}`, { method: "GET" });
};
