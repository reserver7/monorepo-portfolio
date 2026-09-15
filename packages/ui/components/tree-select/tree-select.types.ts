import type * as React from "react";
import type { InputSize, InputStatus, InputVariant } from "../input/input.types";

export type TreeSelectNode = {
  value: string;
  title: React.ReactNode;
  children?: readonly TreeSelectNode[];
  disabled?: boolean;
  selectable?: boolean;
};
export interface TreeSelectProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "defaultValue" | "onChange"
> {
  treeData: readonly TreeSelectNode[];
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiple?: boolean;
  treeCheckable?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClear?: () => void;
  showSearch?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  status?: InputStatus | "warning";
  size?: InputSize;
  variant?: InputVariant;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorMessage?: React.ReactNode;
  required?: boolean;
}
