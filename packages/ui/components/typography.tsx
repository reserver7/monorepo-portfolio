"use client";

import * as React from "react";
import { cn } from "./cn";

type Variant = "h1" | "h2" | "h3" | "title" | "body" | "bodySm" | "caption" | "label";
type Tone = "default" | "muted" | "subtle" | "primary" | "success" | "warning" | "danger" | "info";

const variantClassMap: Record<Variant, string> = {
  h1: "text-heading-xl",
  h2: "text-heading-lg",
  h3: "text-heading-md",
  title: "text-heading-md",
  body: "text-body-md",
  bodySm: "text-body-sm",
  caption: "text-caption",
  label: "text-caption font-semibold"
};

const toneClassMap: Record<Tone, string> = {
  default: "text-foreground",
  muted: "text-muted",
  subtle: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info"
};

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof React.JSX.IntrinsicElements;
  variant?: Variant;
  tone?: Tone;
}

export function Typography({
  as = "p",
  variant = "body",
  tone = "default",
  className,
  ...props
}: TypographyProps) {
  const Comp = as as React.ElementType;
  return <Comp className={cn(variantClassMap[variant], toneClassMap[tone], className)} {...props} />;
}
