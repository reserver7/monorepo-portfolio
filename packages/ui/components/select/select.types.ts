import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import type { RegisterOptions } from "react-hook-form";

export type SelectTriggerSize = "sm" | "md" | "lg";
export type SelectTriggerVariant = "default" | "filled" | "ghost";
export type SelectTriggerStatus = "default" | "error" | "success";

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
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorMessage?: React.ReactNode;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  size?: SelectTriggerSize;
  variant?: SelectTriggerVariant;
  status?: SelectTriggerStatus;
  className?: string;
  style?: React.CSSProperties;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  labelClassName?: string;
  helperClassName?: string;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  searchPlaceholder?: string;
  maxVisibleItems?: number;
  maxTagCount?: number;
}

export interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  size?: SelectTriggerSize;
  variant?: SelectTriggerVariant;
  status?: SelectTriggerStatus;
}

export type SelectContentProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;

export type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;
