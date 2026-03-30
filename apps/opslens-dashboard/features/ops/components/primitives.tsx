"use client";

import type { ReactNode } from "react";
import { Badge, Card, CardContent, CardHeader, Typography, cn } from "@repo/ui";
import type { IssueStatus, Severity } from "@/features/ops/api";

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

export function OpsSectionCard({
  title,
  description,
  children,
  className,
  contentClassName
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card variant="default" className={cn("rounded-2xl border-default bg-surface shadow-sm", className)}>
      <CardHeader className="space-y-1 p-6 pb-0">
        <Typography as="h2" variant="h2" className="text-heading-xl leading-tight">
          {title}
        </Typography>
        {description ? (
          <Typography variant="bodySm" tone="muted" className="leading-6">
            {description}
          </Typography>
        ) : null}
      </CardHeader>
      <CardContent className={cn("p-6 pt-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function OpsInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="muted" className="rounded-xl border-default bg-surface-elevated px-3 py-2.5 text-sm">
      <Typography
        as="p"
        variant="caption"
        tone="subtle"
        className="font-semibold uppercase tracking-wide"
      >
        {label}
      </Typography>
      <Typography as="p" variant="bodySm" className="mt-1 font-medium">
        {value}
      </Typography>
    </Card>
  );
}

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
