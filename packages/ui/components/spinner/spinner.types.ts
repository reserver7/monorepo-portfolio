import * as React from "react";
import type { UiColorToken } from "../../styles/color-token";

export type SpinnerSize = "sm" | "md" | "lg";
export type SpinnerColor = "default" | "primary" | "danger" | "success" | "warning" | UiColorToken;

export interface SpinnerProps {
  open?: boolean;
  fullscreen?: boolean;
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  delayMs?: number;
}
