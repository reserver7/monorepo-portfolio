import type * as React from "react";
import type { InputSize, InputStatus, InputVariant } from "../input/input.types";

export type AutoCompleteOption = { value: string; label?: React.ReactNode; disabled?: boolean };
export interface AutoCompleteProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "onSelect" | "size"
> {
  options?: readonly AutoCompleteOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onSelect?: (value: string, option: AutoCompleteOption) => void;
  onClear?: () => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  defaultOpen?: boolean;
  allowClear?: boolean;
  filterOption?: boolean | ((input: string, option: AutoCompleteOption) => boolean);
  notFoundContent?: React.ReactNode;
  loading?: boolean;
  size?: InputSize;
  variant?: InputVariant;
  status?: InputStatus | "warning";
}
