"use client";

import * as React from "react";
import { cn } from "./cn";

type InputSize = "sm" | "md" | "lg";
type InputVariant = "default" | "filled" | "ghost";
type InputState = "default" | "error" | "success";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: InputSize;
  variant?: InputVariant;
  state?: InputState;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = "md", variant = "default", state = "default", type = "text", ...props }, ref) => {
    const bySize: Record<InputSize, string> = {
      sm: "h-9 text-body-sm",
      md: "h-10 text-body-md",
      lg: "h-11 text-body-md"
    };
    const byVariant: Record<InputVariant, string> = {
      default: "border-default bg-surface",
      filled: "border-transparent bg-surface-elevated",
      ghost: "border-transparent bg-transparent"
    };
    const byState: Record<InputState, string> = {
      default: "focus:border-primary focus:ring-primary/20",
      error: "border-danger/40 focus:border-danger focus:ring-danger/20",
      success: "border-success/40 focus:border-success focus:ring-success/20"
    };

    return (
      <input
        ref={ref}
        type={type}
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
Input.displayName = "Input";
