import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import type { RegisterOptions } from "react-hook-form";

export type CheckboxSize = "sm" | "md";

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, "checked" | "defaultChecked" | "onCheckedChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  size?: CheckboxSize;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorMessage?: React.ReactNode;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  helperClassName?: string;
  control?: unknown;
  rules?: RegisterOptions;
}

export interface CheckboxGroupState<T> {
  allChecked: boolean;
  indeterminate: boolean;
  selectedCount: number;
  totalCount: number;
  isChecked: (item: T) => boolean;
  toggleOne: (item: T) => void;
  toggleAll: () => void;
}
