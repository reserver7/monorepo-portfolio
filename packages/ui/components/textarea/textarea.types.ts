import * as React from "react";
import type { RegisterOptions } from "react-hook-form";

export type TextareaSize = "sm" | "md" | "lg";
export type TextareaVariant = "default" | "filled" | "ghost";
export type TextareaStatus = "default" | "error" | "success";
export type TextareaResize = "none" | "vertical" | "horizontal" | "both";

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  size?: TextareaSize;
  variant?: TextareaVariant;
  status?: TextareaStatus;
  resize?: TextareaResize;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorMessage?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  helperClassName?: string;
  showCount?: boolean;
  countFormatter?: (currentLength: number, maxLength?: number) => React.ReactNode;
  control?: unknown;
  rules?: RegisterOptions;
}
