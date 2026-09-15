import type * as React from "react";
import type { InputSize, InputStatus, InputVariant } from "../input/input.types";

export type MentionOption = { value: string; label?: React.ReactNode; disabled?: boolean };
export interface MentionsProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "defaultValue" | "onChange" | "onSelect" | "size" | "prefix"
> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string, prefix: string) => void;
  onSelect?: (option: MentionOption) => void;
  options?: readonly MentionOption[];
  prefix?: string | string[];
  split?: string;
  status?: InputStatus | "warning";
  size?: InputSize;
  variant?: InputVariant;
  loading?: boolean;
  notFoundContent?: React.ReactNode;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorMessage?: React.ReactNode;
  required?: boolean;
}
