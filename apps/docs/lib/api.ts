import { docsClientEnv } from "@/lib/env";
import { DocumentComment, DocumentRecord, DocumentSummary, HistoryEntry } from "@/lib/types";
import { requestJson } from "@repo/shared-client";

export const API_BASE_URL = docsClientEnv.apiBaseUrl;

export const listDocuments = async (): Promise<DocumentSummary[]> => {
  const payload = await requestJson<{ documents: DocumentSummary[] }>(API_BASE_URL, "/api/documents", {
    method: "GET"
  });

  return payload.documents;
};

export const createDocument = async (input: {
  title: string;
  actor: string;
  editorAccessKey?: string;
}): Promise<{ document: DocumentRecord }> => {
  return requestJson<{ document: DocumentRecord }>(API_BASE_URL, "/api/documents", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const deleteDocumentById = async (input: {
  documentId: string;
  editorAccessKey?: string;
}): Promise<{ ok: true; documentId: string }> => {
  return requestJson<{ ok: true; documentId: string }>(API_BASE_URL, `/api/documents/${input.documentId}`, {
    method: "DELETE",
    body: JSON.stringify({
      editorAccessKey: input.editorAccessKey
    })
  });
};

export const getDocument = async (documentId: string): Promise<{ document: DocumentRecord }> => {
  return requestJson<{ document: DocumentRecord }>(API_BASE_URL, `/api/documents/${documentId}`, {
    method: "GET"
  });
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
    })
  });
};
