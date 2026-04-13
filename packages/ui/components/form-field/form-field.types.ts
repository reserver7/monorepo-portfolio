import * as React from "react";

export type FormFieldSize = "sm" | "md" | "lg";

export interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  size?: FormFieldSize;
  requiredMark?: boolean;
  optionalLabel?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}
