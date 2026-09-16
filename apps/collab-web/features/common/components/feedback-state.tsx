"use client";

import * as React from "react";
import { cn } from "@repo/ui";

type FeedbackStateProps = {
  variant?: "info" | "warning" | "error" | "empty" | "loading";
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};
const config = {
  info: ["i", "border-info/30 bg-info/10 text-info"],
  warning: ["!", "border-warning/30 bg-warning/10 text-warning"],
  error: ["×", "border-danger/30 bg-danger/10 text-danger"],
  empty: ["—", "border-border bg-surface-muted text-text-secondary"],
  loading: ["…", "border-border bg-surface-muted text-text-secondary"]
} as const;
export function FeedbackState({
  variant = "info",
  size = "md",
  align = "center",
  title,
  description,
  action,
  className
}: FeedbackStateProps) {
  const [icon, tone] = config[variant];
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border",
        size === "sm" ? "p-3" : size === "lg" ? "p-6" : "p-4",
        tone,
        className
      )}
    >
      <div
        className={cn(
          "flex gap-3",
          align === "center" ? "items-center justify-center text-center" : "items-start text-left"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "mt-0.5 shrink-0 font-semibold",
            size === "sm" ? "size-4" : "size-5",
            variant === "loading" && "animate-pulse"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-foreground break-words font-semibold">{title}</p>
          {description ? <p className="text-muted mt-1 break-words text-sm">{description}</p> : null}
          {action ? <div className="mt-2">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
