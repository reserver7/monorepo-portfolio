import type * as React from "react";
import type { InputSize, InputStatus, InputVariant } from "../input/input.types";

export type InputNumberValue = number | string | null;
export type InputNumberFormatter = (
  value: InputNumberValue,
  info: { userTyping: boolean; input: string }
) => string;
export type InputNumberParser = (value: string | undefined) => string;
export type InputNumberStepInfo = { offset: number; type: "up" | "down" };

export interface InputNumberProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "size" | "prefix"
> {
  value?: InputNumberValue;
  defaultValue?: InputNumberValue;
  onChange?: (value: InputNumberValue) => void;
  onStep?: (value: InputNumberValue, info: InputNumberStepInfo) => void;
  min?: number;
  max?: number;
  step?: number | string;
  precision?: number;
  stringMode?: boolean;
  controls?: boolean;
  keyboard?: boolean;
  changeOnWheel?: boolean;
  formatter?: InputNumberFormatter;
  parser?: InputNumberParser;
  size?: InputSize;
  variant?: InputVariant;
  status?: InputStatus | "warning";
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
}
