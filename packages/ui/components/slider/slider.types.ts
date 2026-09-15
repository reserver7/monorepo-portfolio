import * as React from "react";

export type SliderValue = number | [number, number];
export interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  value?: SliderValue;
  defaultValue?: SliderValue;
  min?: number;
  max?: number;
  step?: number | null;
  onChange?: (value: SliderValue) => void;
  onChangeComplete?: (value: SliderValue) => void;
  range?: boolean;
  disabled?: boolean;
  reverse?: boolean;
  tooltip?: boolean;
  marks?: Record<number, React.ReactNode>;
}
