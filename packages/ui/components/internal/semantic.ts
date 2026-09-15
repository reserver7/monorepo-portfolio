import type { ComponentStatus } from "../../foundations";

export type SemanticTone = ComponentStatus | "neutral";

export const semanticToneClass: Record<SemanticTone, string> = {
  default: "border-border bg-surface-muted text-text-secondary",
  neutral: "border-border bg-surface-muted text-text-secondary",
  info: "border-info/35 bg-info/10 text-info",
  success: "border-success/35 bg-success/10 text-success",
  warning: "border-warning/35 bg-warning/10 text-warning",
  error: "border-danger/35 bg-danger/10 text-danger",
  validating: "border-info/35 bg-info/10 text-info"
};

export const semanticIndicatorClass: Record<SemanticTone, string> = {
  default: "bg-border text-text-secondary",
  neutral: "bg-border text-text-secondary",
  info: "bg-info text-info-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  error: "bg-danger text-danger-foreground",
  validating: "bg-info text-info-foreground"
};

export function resolveSemanticTone(value?: string): SemanticTone {
  if (!value || value === "blue" || value === "gray") return "neutral";
  if (value === "green") return "success";
  if (value === "red") return "error";
  if (value === "processing" || value === "validating") return "info";
  return value in semanticToneClass ? (value as SemanticTone) : "neutral";
}
