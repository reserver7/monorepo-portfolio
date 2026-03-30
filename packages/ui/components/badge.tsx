"use client";

import * as React from "react";
import { cn } from "./cn";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "destructive"
  | "info";
type BadgeSize = "sm" | "md" | "lg";
type BadgeShape = "pill" | "rounded" | "square";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
}

export function Badge({ className, variant = "default", size = "sm", shape = "pill", ...props }: BadgeProps) {
  const byVariant: Record<BadgeVariant, string> = {
    default: "bg-primary/10 text-primary",
    secondary: "bg-surface-elevated text-foreground",
    outline: "border border-default bg-transparent text-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
    destructive: "bg-danger/15 text-danger",
    info: "bg-info/15 text-info"
  };
  const bySize: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-caption",
    md: "px-2.5 py-1 text-body-sm",
    lg: "px-3 py-1.5 text-body-md"
  };
  const byShape: Record<BadgeShape, string> = {
    pill: "rounded-full",
    rounded: "rounded-md",
    square: "rounded-sm"
  };

  return (
    <div
      className={cn(
        "inline-flex items-center font-semibold",
        byVariant[variant],
        bySize[size],
        byShape[shape],
        className
      )}
      {...props}
    />
  );
}
