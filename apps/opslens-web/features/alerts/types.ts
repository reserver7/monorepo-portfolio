export type OpsAlertLevel = "critical" | "high" | "info";

export type OpsAlert = {
  id: string;
  title: string;
  message?: string;
  level: OpsAlertLevel;
  source?: string;
  link?: string;
  createdAt: string;
  readAt?: string;
};

export type CreateOpsAlertInput = {
  title: string;
  message?: string;
  level?: OpsAlertLevel;
  source?: string;
  link?: string;
  createdAt?: string;
};
