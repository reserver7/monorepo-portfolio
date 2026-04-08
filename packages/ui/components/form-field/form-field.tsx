"use client";

import * as React from "react";
import { cn } from "../cn";
import { Label } from "../label";
import { FORM_FIELD_DEFAULTS, FORM_FIELD_SIZE_CONFIG } from "./form-field.constants";
import type { FormFieldProps } from "./form-field.types";

export function FormField({
  label,
  htmlFor,
  size = FORM_FIELD_DEFAULTS.size,
  requiredMark = FORM_FIELD_DEFAULTS.requiredMark,
  optionalLabel,
  description,
  error,
  className,
  children
}: FormFieldProps) {
  const bySize = FORM_FIELD_SIZE_CONFIG[size];

  return (
    <div className={cn("grid", bySize.gap, className)}>
      {label ? (
        <Label htmlFor={htmlFor} size={bySize.label} required={requiredMark} className="inline-flex items-center gap-1">
          <span>{label}</span>
          {!requiredMark && optionalLabel ? <span className="text-muted">({optionalLabel})</span> : null}
        </Label>
      ) : null}
      {children}
      {description ? <p className={cn("text-muted", bySize.description)}>{description}</p> : null}
      {error ? <p className={cn("text-danger", bySize.error)}>{error}</p> : null}
    </div>
  );
}
