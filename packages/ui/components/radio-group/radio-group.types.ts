import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { RegisterOptions } from "react-hook-form";

export type RadioGroupSize = "sm" | "md";
export type RadioGroupOrientation = "vertical" | "horizontal";

export interface RadioOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
    "value" | "defaultValue" | "onValueChange"
  > {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options?: RadioOption[];
  size?: RadioGroupSize;
  orientation?: RadioGroupOrientation;
  helperText?: React.ReactNode;
  errorMessage?: React.ReactNode;
  required?: boolean;
  containerClassName?: string;
  helperClassName?: string;
  optionClassName?: string;
  optionLabelClassName?: string;
  control?: unknown;
  rules?: RegisterOptions;
}

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  size?: RadioGroupSize;
}
