"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Inbox, Info, Loader2 } from "lucide-react";
import { cn } from "./cn";

type StateVariant = "empty" | "error" | "warning" | "info" | "success" | "loading";
type StateSize = "sm" | "md" | "lg";
type StateAlign = "left" | "center";
type StateLayout = "inline" | "stacked";

export interface StateViewProps {
  variant?: StateVariant;
  size?: StateSize;
  align?: StateAlign;
  layout?: StateLayout;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function StateView({
  variant = "info",
  size = "md",
  align = "center",
  layout = "inline",
  title,
  description,
  className,
  action,
  icon
}: StateViewProps) {
  const byVariant = {
    empty: { icon: Inbox, box: "bg-surface-elevated", text: "text-muted" },
    error: { icon: AlertCircle, box: "bg-danger/10", text: "text-danger" },
    warning: { icon: AlertTriangle, box: "bg-warning/10", text: "text-warning" },
    info: { icon: Info, box: "bg-info/10", text: "text-info" },
    success: { icon: CheckCircle2, box: "bg-success/10", text: "text-success" },
    loading: { icon: Loader2, box: "bg-surface-elevated", text: "text-primary" }
  } as const;

  const bySize: Record<StateSize, string> = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6"
  };
  const byLayout: Record<StateLayout, string> = {
    inline: "flex gap-3",
    stacked: "flex flex-col gap-2"
  };

  const Icon = byVariant[variant].icon;

  return (
    <div className={cn("border-default rounded-xl border", byVariant[variant].box, bySize[size], className)}>
      <div
        className={cn(
          byLayout[layout],
          align === "center" ? "items-center justify-center text-center" : "items-start"
        )}
      >
        {icon ?? (
          <Icon
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              byVariant[variant].text,
              variant === "loading" && "animate-spin"
            )}
          />
        )}
        <div>
          <p className="text-body-sm text-foreground font-semibold">{title}</p>
          {description ? <p className="text-caption text-muted mt-1">{description}</p> : null}
          {action ? <div className="mt-2">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
