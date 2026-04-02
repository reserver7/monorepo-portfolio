"use client";

import * as React from "react";
import { cn } from "./cn";

type Tone = "default" | "primary" | "danger" | "warning";
type Size = "sm" | "md" | "lg";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
}

export function StatCard({ label, value, helper, tone = "default", size = "md", className }: StatCardProps) {
  const toneCls: Record<Tone, string> = {
    default: "border-default bg-surface",
    primary: "border-primary/30 bg-primary/5",
    danger: "border-danger/30 bg-danger/5",
    warning: "border-warning/30 bg-warning/5"
  };

  const sizeCls: Record<Size, string> = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5"
  };

  return (
    <div className={cn("rounded-xl border", toneCls[tone], sizeCls[size], className)}>
      <p className="text-muted text-xs font-medium">{label}</p>
      <p className="text-foreground mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {helper ? <p className="text-muted mt-1 text-xs">{helper}</p> : null}
    </div>
  );
}
