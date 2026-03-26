"use client";

import { Badge, Card, CardContent, CardHeader, Typography } from "@repo/ui";
import type { IssueStatus, Severity } from "@/lib/api";

const severityToneMap: Record<Severity, string> = {
  critical: "border-danger/30 bg-danger/10 text-danger",
  high: "border-warning/30 bg-warning/10 text-warning",
  medium: "border-warning/30 bg-warning/10 text-warning",
  low: "border-primary/30 bg-primary/10 text-primary"
};

const statusToneMap: Record<IssueStatus, string> = {
  new: "border-default bg-surface-elevated text-muted",
  analyzing: "border-default bg-surface-elevated text-muted",
  in_progress: "border-primary/30 bg-primary/10 text-primary",
  resolved: "border-success/30 bg-success/10 text-success"
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
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-default bg-surface shadow-sm">
      <CardHeader className="space-y-1 p-5">
        <Typography as="h2" variant="h3" className="text-heading-lg">
          {title}
        </Typography>
        {description ? (
          <Typography variant="bodySm" tone="muted">
            {description}
          </Typography>
        ) : null}
      </CardHeader>
      <CardContent className="p-5 pt-0">{children}</CardContent>
    </Card>
  );
}

export function OpsInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-default bg-surface-elevated px-3 py-2 text-sm">
      <Typography as="p" variant="caption" tone="subtle" className="font-semibold uppercase tracking-wide">
        {label}
      </Typography>
      <Typography as="p" variant="bodySm" className="mt-1 font-medium">
        {value}
      </Typography>
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant="outline" className={`rounded-md px-2 py-1 text-xs font-semibold ${severityToneMap[severity]}`}>
      {severity}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <Badge variant="outline" className={`rounded-md px-2 py-1 text-xs font-semibold ${statusToneMap[status]}`}>
      {statusLabelMap[status]}
    </Badge>
  );
}
