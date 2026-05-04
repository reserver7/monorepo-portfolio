import * as React from "react";
import type { Control, FieldValues, RegisterOptions } from "react-hook-form";
import type { InputProps } from "../input";

export type TimeValue = string;
export type TimeFormat = "HH:mm" | "HH:mm:ss" | "h:mm A" | "h:mm:ss A";
export type TimePickerPlacement = "bottomLeft" | "bottomRight" | "topLeft" | "topRight";
export type TimePickerVariant = "outlined" | "filled" | "borderless" | "underlined" | "default" | "outline" | "ghost";
export type TimePickerStatus = "error" | "warning" | "success" | "validating" | "default";
export type TimeRangeValue = {
  start?: TimeValue;
  end?: TimeValue;
};
export type DisabledTimeConfig = {
  disabledHours?: () => number[];
  disabledMinutes?: (selectedHour: number) => number[];
  disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
};

export interface TimePickerProps
  extends Omit<InputProps, "type" | "value" | "defaultValue" | "onChange" | "prefix" | "suffix" | "status" | "variant"> {
  value?: TimeValue;
  defaultValue?: TimeValue;
  format?: TimeFormat;
  use12Hours?: boolean;
  showSeconds?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  disabledHours?: () => number[];
  disabledMinutes?: (selectedHour: number) => number[];
  disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
  hideDisabledOptions?: boolean;
  needConfirm?: boolean;
  showNow?: boolean;
  changeOnScroll?: boolean;
  inputReadOnly?: boolean;
  prefix?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  placement?: TimePickerPlacement;
  renderExtraFooter?: () => React.ReactNode;
  allowClear?: boolean | { clearIcon?: React.ReactNode };
  variant?: TimePickerVariant;
  status?: TimePickerStatus;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (nextOpen: boolean) => void;
  clearable?: boolean;
  onValueChange?: (nextValue: string) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  control?: Control<FieldValues>;
  rules?: RegisterOptions<FieldValues>;
}

export interface TimeRangePickerProps extends Omit<TimePickerProps, "value" | "defaultValue" | "onValueChange" | "onChange" | "name" | "id"> {
  value?: TimeRangeValue;
  defaultValue?: TimeRangeValue;
  onValueChange?: (nextValue: TimeRangeValue) => void;
  disabledTime?: (value: TimeRangeValue, type: "start" | "end") => DisabledTimeConfig;
  order?: boolean;
  invalidOrderMessage?: React.ReactNode;
  startPlaceholder?: string;
  endPlaceholder?: string;
  separator?: React.ReactNode;
}
