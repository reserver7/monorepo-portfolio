import * as React from "react";
import type { RegisterOptions } from "react-hook-form";

export type InputSize = "sm" | "md" | "lg";
export type InputVariant = "default" | "outline" | "filled" | "ghost";
export type InputStatus = "default" | "error" | "success";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  size?: InputSize;
  variant?: InputVariant;
  status?: InputStatus;
  state?: InputStatus;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorMessage?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  containerClassName?: string;
  labelClassName?: string;
  helperClassName?: string;
  control?: unknown;
  rules?: RegisterOptions;
}
