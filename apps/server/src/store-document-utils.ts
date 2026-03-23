export const EMPTY_TITLE = "(제목 없음)";

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const summarize = (text: string): string => {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length <= 120 ? compact : `${compact.slice(0, 117)}...`;
};

export const nowIso = (): string => new Date().toISOString();

export const sanitizeDocumentTitle = (rawTitle: string): string => {
  const normalized = rawTitle.trim();
  return normalized || EMPTY_TITLE;
};

export const sanitizeCommentBody = (rawBody: string): string => {
  const normalized = rawBody.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 500);
};

export const sanitizeMention = (rawMention: string): string => {
  return rawMention.trim().replace(/^@+/, "").slice(0, 24);
};
