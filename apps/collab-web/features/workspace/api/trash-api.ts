import type { DocumentSummary, WhiteboardSummary } from "@repo/utils/collab";

export type TrashItemKind = "document" | "board";

export type WorkspaceTrash = {
  documents: DocumentSummary[];
  boards: WhiteboardSummary[];
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(payload.message ?? "휴지통 요청에 실패했습니다.");
  return payload;
};

export const listTrash = async (): Promise<WorkspaceTrash> =>
  parseResponse<WorkspaceTrash>(
    await fetch("/api/workspace/trash", { credentials: "include", cache: "no-store" })
  );

export const restoreTrashItem = async (input: { kind: TrashItemKind; id: string }) =>
  parseResponse<{ ok: true }>(
    await fetch(`/api/workspace/trash/${input.kind}/${input.id}/restore`, {
      method: "POST",
      credentials: "include"
    })
  );

export const permanentlyDeleteTrashItem = async (input: { kind: TrashItemKind; id: string }) =>
  parseResponse<{ ok: true }>(
    await fetch(`/api/workspace/trash/${input.kind}/${input.id}`, {
      method: "DELETE",
      credentials: "include"
    })
  );
