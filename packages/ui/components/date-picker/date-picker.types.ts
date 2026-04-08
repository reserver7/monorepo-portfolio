import * as React from "react";
import type { Control, FieldValues, RegisterOptions } from "react-hook-form";
import type { InputProps } from "../input";
import type { InputStatus } from "../input/input.types";

export type DateValue = string | Date;
export type DatePickerMode = "single" | "range";

export interface DateRangeValue {
  from?: DateValue;
  to?: DateValue;
}

export interface DateRangeStringValue {
  from?: string;
  to?: string;
}

export interface DatePickerProps
  extends Omit<InputProps, "type" | "value" | "defaultValue" | "min" | "max" | "onChange" | "prefix" | "suffix"> {
  mode?: DatePickerMode;
  value?: DateValue;
  defaultValue?: DateValue;
  range?: DateRangeValue;
  defaultRange?: DateRangeValue;
  minDate?: DateValue;
  maxDate?: DateValue;
  state?: InputStatus;
  showIcon?: boolean;
  icon?: React.ReactNode;
  locale?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (nextValue: string) => void;
  onRangeChange?: (nextRange: DateRangeStringValue) => void;
  control?: Control<FieldValues>;
  rules?: RegisterOptions<FieldValues>;
}

export type DateRangePickerProps = Omit<DatePickerProps, "mode" | "value" | "defaultValue" | "onValueChange">;

export interface DatePickerFieldProps extends Omit<DatePickerProps, "label" | "helperText" | "errorMessage"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  helperText?: React.ReactNode;
  errorMessage?: React.ReactNode;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  helperClassName?: string;
}

export interface DateRangePickerFieldProps extends Omit<DatePickerFieldProps, "mode" | "value" | "defaultValue" | "onValueChange"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  helperText?: React.ReactNode;
  errorMessage?: React.ReactNode;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  helperClassName?: string;
}
