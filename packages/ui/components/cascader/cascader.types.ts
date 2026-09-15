import type * as React from "react";
import type { InputSize, InputStatus, InputVariant } from "../input/input.types";

export type CascaderOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  children?: readonly CascaderOption[];
};
export interface CascaderProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "defaultValue" | "onChange"
> {
  options: readonly CascaderOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[], selectedOptions: CascaderOption[]) => void;
  onOpenChange?: (open: boolean) => void;
  onClear?: () => void;
  open?: boolean;
  defaultOpen?: boolean;
  allowClear?: boolean;
  showSearch?: boolean;
  multiple?: boolean;
  placeholder?: string;
  size?: InputSize;
  variant?: InputVariant;
  status?: InputStatus | "warning";
}
