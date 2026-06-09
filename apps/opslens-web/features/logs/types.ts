import type { analyzeLogs } from "@repo/opslens";

export type LogsFormValues = {
  source: "server" | "client" | "api" | "console" | "sentry";
  serviceName: string;
  deploymentVersion?: string;
  rawLogs: string;
};

export type LogsSeverityFilter = "all" | "critical" | "high" | "medium" | "low";
export type LogsSortKey = "countDesc" | "latestDesc" | "severityDesc";

export type LogsSavedView = {
  id: string;
  name: string;
  severity: LogsSeverityFilter;
  query: string;
  sort: LogsSortKey;
};

export type LogsSavedViewsState = {
  items: LogsSavedView[];
  activeId: string | null;
};

export type LogsCorrelationToken = {
  key: "traceId" | "requestId";
  value: string;
};

export type LogsCluster = Awaited<ReturnType<typeof analyzeLogs>>["clusters"][number];
