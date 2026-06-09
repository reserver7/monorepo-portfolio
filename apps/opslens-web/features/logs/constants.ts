export const LOGS_DEFAULT_CLUSTER_LIMIT = 12;
export const LOGS_SAVED_VIEWS_KEY = "opslens.logs.savedViews.v1";

export const LOGS_SAMPLE = `2026-03-25T10:14:11Z ERROR checkout-api Payment timeout while calling gateway
2026-03-25T10:14:43Z ERROR checkout-api Payment timeout while calling gateway
2026-03-25T10:15:05Z WARN docs-api Permission loop detected for document ACL
2026-03-25T10:16:02Z ERROR ui-shell Cannot read properties of undefined (reading 'id')`;

export const LOGS_SEVERITY_VARIANT_MAP = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "success"
} as const;
