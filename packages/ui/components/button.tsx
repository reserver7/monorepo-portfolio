"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

export type ButtonVariant =
  | "default"
  | "destructive"
  | "success"
  | "warning"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";
export type ButtonSize = "default" | "sm" | "md" | "lg" | "icon" | "iconSm";

export const buttonVariants = ({
  variant = "default",
  size = "default",
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) => {
  const byVariant: Record<ButtonVariant, string> = {
    default: "bg-primary text-primary-foreground hover:opacity-95",
    destructive: "bg-danger text-danger-foreground hover:opacity-95",
    success: "bg-success text-success-foreground hover:opacity-95",
    warning: "bg-warning text-warning-foreground hover:opacity-95",
    outline: "border border-default bg-surface text-foreground hover:bg-surface-elevated",
    secondary: "bg-surface-elevated text-foreground hover:opacity-95",
    ghost: "text-muted hover:bg-surface-elevated hover:text-foreground",
    link: "text-primary underline-offset-4 hover:underline"
  };

  const bySize: Record<ButtonSize, string> = {
    default: "h-10 px-4 py-2",
    md: "h-10 px-4 py-2",
    sm: "h-9 px-3 text-xs",
    lg: "h-11 px-6",
    icon: "h-10 w-10",
    iconSm: "h-9 w-9"
  };

  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
    byVariant[variant],
    bySize[size],
    className
  );
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, loading = false, loadingLabel, variant = "default", size = "default", className, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={asChild ? undefined : isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading && loadingLabel ? loadingLabel : children}
      </Comp>
    );
  }
);
Button.displayName = "Button";
