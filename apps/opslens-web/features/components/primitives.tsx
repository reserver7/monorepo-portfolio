"use client";

import { Badge, ConsoleInfoItem, ConsolePageStack, ConsoleSectionCard } from "@repo/ui";
import type { IssueStatus, Severity } from "@repo/opslens";

const severityVariantMap: Record<Severity, "danger" | "warning" | "info"> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "info"
};

const statusVariantMap: Record<IssueStatus, "outline" | "warning" | "info" | "success"> = {
  new: "outline",
  analyzing: "info",
  in_progress: "warning",
  resolved: "success"
};

const statusLabelMap: Record<IssueStatus, string> = {
  new: "신규",
  analyzing: "분석중",
  in_progress: "대응중",
  resolved: "해결"
};

export const OpsSectionCard = ConsoleSectionCard;
export const OpsPageShell = ConsolePageStack;
export const OpsInfoItem = ConsoleInfoItem;

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant={severityVariantMap[severity]} size="sm" className="rounded-md font-semibold">
      {severity}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <Badge variant={statusVariantMap[status]} size="sm" className="rounded-md font-semibold">
      {statusLabelMap[status]}
    </Badge>
  );
}
