"use client";


import * as React from "react";
import { AlertCircle, CheckCircle2, Info, Loader2, TriangleAlert } from "lucide-react";
import { Box, Flex, Typography, cn } from "@repo/ui";

type FeedbackStateProps = { variant?: "info" | "success" | "warning" | "error" | "empty" | "loading"; size?: "sm" | "md" | "lg"; align?: "left" | "center"; title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string };
const config = { info: [Info, "border-info/30 bg-info/10 text-info"], success: [CheckCircle2, "border-success/30 bg-success/10 text-success"], warning: [TriangleAlert, "border-warning/30 bg-warning/10 text-warning"], error: [AlertCircle, "border-danger/30 bg-danger/10 text-danger"], empty: [Info, "border-border bg-surface-muted text-text-secondary"], loading: [Loader2, "border-border bg-surface-muted text-text-secondary"] } as const;
export function FeedbackState({ variant = "info", size = "md", align = "center", title, description, action, className }: FeedbackStateProps) {
  const [Icon, tone] = config[variant];
  return <Box className={cn("rounded-[var(--radius-xl)] border", size === "sm" ? "p-3" : size === "lg" ? "p-6" : "p-4", tone, className)}><Flex className={cn("gap-3", align === "center" ? "items-center justify-center text-center" : "items-start text-left")}><Icon aria-hidden className={cn("mt-0.5 shrink-0", size === "sm" ? "size-4" : "size-5", variant === "loading" && "animate-spin")} /><Box className="min-w-0 flex-1"><Typography as="p" className="break-words font-semibold text-foreground">{title}</Typography>{description ? <Typography as="p" className="mt-1 break-words text-sm text-muted">{description}</Typography> : null}{action ? <Box className="mt-2">{action}</Box> : null}</Box></Flex></Box>;
}

export function MetricCard({ label, value, helper, color = "default", size = "md", className }: { label: React.ReactNode; value: React.ReactNode; helper?: React.ReactNode; color?: string; size?: string; className?: string }) {
  const tone = { danger: "border-danger/30 bg-danger/5", warning: "border-warning/30 bg-warning/5", info: "border-info/30 bg-info/5", success: "border-success/30 bg-success/5", primary: "border-primary/30 bg-primary/5", default: "border-border bg-surface" }[color] ?? "border-border bg-surface";
  const padding = size === "sm" ? "p-3" : size === "lg" ? "p-6" : "p-4";
  return <Box className={cn("rounded-[var(--radius-xl)] border", tone, padding, className)}><Typography as="p" className="text-xs font-medium text-muted">{label}</Typography><Typography as="p" className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</Typography>{helper ? <Typography as="p" className="mt-1 break-words text-xs text-muted">{helper}</Typography> : null}</Box>;
}
