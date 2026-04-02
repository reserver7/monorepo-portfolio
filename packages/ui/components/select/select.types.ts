import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import type { RegisterOptions } from "react-hook-form";

export type SelectTriggerSize = "sm" | "md" | "lg";
export type SelectTriggerVariant = "default" | "filled" | "ghost";
export type SelectTriggerState = "default" | "error" | "success";

export type SelectPrimitiveValue = string | number;

export interface SelectOption<T = SelectPrimitiveValue> {
  label: React.ReactNode;
  value: T;
  disabled?: boolean;
  keywords?: string;
}

export interface SelectProps<T = SelectPrimitiveValue> {
  options: Array<SelectOption<T>>;
  value?: T | T[] | null;
  onChange?: (value: T | T[] | null) => void;
  name?: string;
  control?: unknown;
  rules?: RegisterOptions;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  size?: SelectTriggerSize;
  variant?: SelectTriggerVariant;
  state?: SelectTriggerState;
  className?: string;
  contentClassName?: string;
  searchPlaceholder?: string;
  maxVisibleItems?: number;
}

export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  size?: SelectTriggerSize;
  variant?: SelectTriggerVariant;
  state?: SelectTriggerState;
}

export type SelectContentProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;

export type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;
