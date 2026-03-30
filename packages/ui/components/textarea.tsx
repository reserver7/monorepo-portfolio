"use client";

import * as React from "react";
import { cn } from "./cn";

type TextareaSize = "sm" | "md" | "lg";
type TextareaVariant = "default" | "filled" | "ghost";
type TextareaState = "default" | "error" | "success";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: TextareaSize;
  variant?: TextareaVariant;
  state?: TextareaState;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size = "md", variant = "default", state = "default", ...props }, ref) => {
    const bySize: Record<TextareaSize, string> = {
      sm: "min-h-[84px] text-body-sm",
      md: "min-h-[110px] text-body-md",
      lg: "min-h-[140px] text-body-md"
    };
    const byVariant: Record<TextareaVariant, string> = {
      default: "border-default bg-surface",
      filled: "border-transparent bg-surface-elevated",
      ghost: "border-transparent bg-transparent"
    };
    const byState: Record<TextareaState, string> = {
      default: "focus:border-primary focus:ring-primary/20",
      error: "border-danger/40 focus:border-danger focus:ring-danger/20",
      success: "border-success/40 focus:border-success focus:ring-success/20"
    };

    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-md border px-3 py-2 text-foreground placeholder:text-muted outline-none ring-0 transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
          bySize[size],
          byVariant[variant],
          byState[state],
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
