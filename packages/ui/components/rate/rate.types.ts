import type * as React from "react";

export interface RateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  count?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  allowHalf?: boolean;
  allowClear?: boolean;
  character?: React.ReactNode;
  tooltips?: readonly string[];
  disabled?: boolean;
}
