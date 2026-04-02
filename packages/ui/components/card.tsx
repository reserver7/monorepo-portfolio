"use client";

import * as React from "react";
import { cn } from "./cn";

type CardVariant = "default" | "elevated" | "muted" | "ghost";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}
export function Card({ className, variant = "default", interactive = false, ...props }: CardProps) {
  const byVariant: Record<CardVariant, string> = {
    default: "border-default bg-surface shadow-sm",
    elevated: "border-default bg-surface-elevated shadow-md",
    muted: "border-default bg-surface-elevated shadow-sm",
    ghost: "border-transparent bg-transparent shadow-none"
  };
  const interactiveClassName = interactive ? "transition-all hover:-translate-y-0.5 hover:shadow-md" : "";

  return (
    <div
      className={cn("rounded-xl border", byVariant[variant], interactiveClassName, className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-heading-md", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body-sm text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
