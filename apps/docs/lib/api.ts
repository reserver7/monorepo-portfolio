import { docsClientEnv } from "@/lib/env";
import { DocumentComment, DocumentRecord, DocumentSummary, HistoryEntry } from "@/lib/types";

export const API_BASE_URL = docsClientEnv.apiBaseUrl;

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
};

export const listDocuments = async (): Promise<DocumentSummary[]> => {
  const payload = await request<{ documents: DocumentSummary[] }>("/api/documents", {
    method: "GET"
  });

  return payload.documents;
};

export const createDocument = async (input: {
  title: string;
  actor: string;
}): Promise<{ document: DocumentRecord }> => {
  return request<{ document: DocumentRecord }>("/api/documents", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const getDocument = async (documentId: string): Promise<{ document: DocumentRecord }> => {
  return request<{ document: DocumentRecord }>(`/api/documents/${documentId}`, {
    method: "GET"
  });
};

export const getDocumentHistory = async (
  documentId: string
): Promise<{
  documentId: string;
  history: HistoryEntry[];
}> => {
  return request<{ documentId: string; history: HistoryEntry[] }>(`/api/documents/${documentId}/history`, {
    method: "GET"
  });
};

export const getDocumentComments = async (
  documentId: string
): Promise<{
  documentId: string;
  comments: DocumentComment[];
}> => {
  return request<{ documentId: string; comments: DocumentComment[] }>(
    `/api/documents/${documentId}/comments`,
    {
      method: "GET"
    }
  );
};

export const createDocumentComment = async (input: {
  documentId: string;
  authorSessionId: string;
  authorName: string;
  body: string;
  mentions?: string[];
}): Promise<{ documentId: string; comment: DocumentComment }> => {
  return request<{ documentId: string; comment: DocumentComment }>(
    `/api/documents/${input.documentId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({
        authorSessionId: input.authorSessionId,
        authorName: input.authorName,
        body: input.body,
        mentions: input.mentions
      })
    }
  );
};
