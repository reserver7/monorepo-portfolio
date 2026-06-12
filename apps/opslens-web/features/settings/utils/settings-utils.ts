import type { BadgeVariant } from "@repo/ui";

export const SETTING_RISK_TONE: Record<string, BadgeVariant> = {
  low: "secondary",
  medium: "info",
  high: "warning",
  critical: "danger"
};

export const AUDIT_SEVERITY_TONE: Record<string, BadgeVariant> = {
  info: "secondary",
  warning: "warning",
  critical: "danger"
};

export const parseJsonLabel = (value?: string | null) => {
  if (!value) return "";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

export const formatSettingsDateTime = (value: string | number | Date) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

export const formatAuditListDateTime = (value: string | number | Date) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

export const formatAuditDetailDateTime = (value: string | number | Date) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
