import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import type { UiColorToken } from "../../styles/color-token";

export type ProgressSize = "sm" | "md" | "lg";
export type ProgressColor = "primary" | "success" | "warning" | "danger" | "info" | UiColorToken;

export interface ProgressProps extends ProgressPrimitive.ProgressProps {
  size?: ProgressSize;
  color?: ProgressColor;
  striped?: boolean;
  showValue?: boolean;
  indeterminate?: boolean;
  label?: React.ReactNode;
}
