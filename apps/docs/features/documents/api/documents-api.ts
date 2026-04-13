import { docsClientEnv } from "@/lib/config";
import { DocumentComment, DocumentRecord, DocumentSummary, HistoryEntry } from "@/features/collaboration/model";
import { createQueryKeys, createResourceClient, requestJson } from "@repo/react-query";

export const API_BASE_URL = docsClientEnv.apiBaseUrl;
const docsKeysBase = createQueryKeys("docs");

export const docsQueryKeys = {
  all: docsKeysBase.all,
  documents: () => docsKeysBase.lists(),
  document: (documentId: string) => docsKeysBase.detail(documentId),
  history: (documentId: string) => docsKeysBase.custom("history", documentId),
  comments: (documentId: string) => docsKeysBase.custom("comments", documentId)
};

const documentsResource = createResourceClient<
  DocumentSummary,
  DocumentRecord,
  "documents",
  "document",
  "documentId"
>(API_BASE_URL, "/api/documents", {
  list: "documents",
  item: "document",
  deleteId: "documentId"
});

export const listDocuments = async (): Promise<DocumentSummary[]> => {
  return documentsResource.list();
};

export const createDocument = async (input: {
  title: string;
  actor: string;
  editorAccessKey?: string;
}): Promise<{ document: DocumentRecord }> => {
  return documentsResource.create(input, {
    successMessage: "문서가 생성되었습니다."
  });
};

export const deleteDocumentById = async (input: {
  documentId: string;
  editorAccessKey?: string;
  notifyOnError?: boolean;
}): Promise<{ ok: true; documentId: string }> => {
  return documentsResource.deleteById(
    input.documentId,
    {
      editorAccessKey: input.editorAccessKey
    },
    {
      notifyOnError: input.notifyOnError,
      successMessage: "문서가 삭제되었습니다."
    }
  );
};

export const getDocument = async (documentId: string): Promise<{ document: DocumentRecord }> => {
  return documentsResource.getById(documentId);
};

export const getDocumentHistory = async (
  documentId: string
): Promise<{
  documentId: string;
  history: HistoryEntry[];
}> => {
  return requestJson<{ documentId: string; history: HistoryEntry[] }>(
    API_BASE_URL,
    `/api/documents/${documentId}/history`,
    {
      method: "GET"
    }
  );
};

export const getDocumentComments = async (
  documentId: string
): Promise<{
  documentId: string;
  comments: DocumentComment[];
}> => {
  return requestJson<{ documentId: string; comments: DocumentComment[] }>(
    API_BASE_URL,
    `/api/documents/${documentId}/comments`,
    {
      method: "GET"
    }
  );
};

export const createDocumentComment = async (input: {
  documentId: string;
  sessionId?: string;
  sessionToken?: string;
  authorName: string;
  body: string;
  mentions?: string[];
}): Promise<{
  documentId: string;
  comment: DocumentComment;
  session?: { id: string; token: string; trusted: boolean };
}> => {
  return requestJson<{
    documentId: string;
    comment: DocumentComment;
    session?: { id: string; token: string; trusted: boolean };
  }>(API_BASE_URL, `/api/documents/${input.documentId}/comments`, {
    method: "POST",
    headers: {
      ...(input.sessionId ? { "x-collab-session-id": input.sessionId } : {}),
      ...(input.sessionToken ? { "x-collab-session-token": input.sessionToken } : {})
    },
    body: JSON.stringify({
      authorName: input.authorName,
      body: input.body,
      mentions: input.mentions
    }),
    successMessage: "댓글이 등록되었습니다."
  });
};
