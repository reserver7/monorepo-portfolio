import type { LogsCluster, LogsCorrelationToken, LogsSortKey } from "../types";

export const createLogsSavedViewId = (): string => {
  if (typeof globalThis !== "undefined" && "crypto" in globalThis && typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getAnalyzeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    if (error.message.toLowerCase().includes("network")) {
      return "네트워크 상태를 확인한 뒤 다시 시도하세요.";
    }
    return error.message;
  }
  return "로그 분석에 실패했습니다.";
};

export const getLogsLineCount = (rawLogs: string): number =>
  rawLogs.trim().length === 0 ? 0 : rawLogs.split("\n").filter((line) => line.trim().length > 0).length;

export const extractCorrelationTokens = (rawLogs: string): LogsCorrelationToken[] => {
  const matches = rawLogs.matchAll(/\b(traceId|requestId)=([a-zA-Z0-9_-]+)\b/g);
  const unique = new Map<string, LogsCorrelationToken>();
  for (const match of matches) {
    const key = match[1] as "traceId" | "requestId";
    const value = match[2] ?? "";
    if (value.length === 0) continue;
    const id = `${key}:${value}`;
    if (!unique.has(id)) unique.set(id, { key, value });
    if (unique.size >= 10) break;
  }
  return Array.from(unique.values());
};

export const sortLogClusters = (clusters: LogsCluster[], sortKey: LogsSortKey): LogsCluster[] => {
  const severityRank: Record<"critical" | "high" | "medium" | "low", number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  return [...clusters].sort((a, b) => {
    if (sortKey === "countDesc") return b.count - a.count;
    if (sortKey === "latestDesc") return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    return severityRank[b.severity] - severityRank[a.severity];
  });
};
