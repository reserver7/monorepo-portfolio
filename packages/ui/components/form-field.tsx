"use client";

import * as React from "react";
import { cn } from "./cn";
import { Label } from "./label";

type FieldSize = "sm" | "md" | "lg";

export interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  size?: FieldSize;
  requiredMark?: boolean;
  optionalLabel?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  size = "md",
  requiredMark = false,
  optionalLabel,
  description,
  error,
  className,
  children
}: FormFieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <Label
          htmlFor={htmlFor}
          size={size === "lg" ? "md" : "sm"}
          className="inline-flex items-center gap-1"
        >
          <span>{label}</span>
          {requiredMark ? <span className="text-danger">*</span> : null}
          {!requiredMark && optionalLabel ? <span className="text-muted">({optionalLabel})</span> : null}
        </Label>
      ) : null}
      {children}
      {description ? <p className="text-muted text-xs">{description}</p> : null}
      {error ? <p className="text-danger text-xs">{error}</p> : null}
    </div>
  );
}
