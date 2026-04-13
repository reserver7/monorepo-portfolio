import * as React from "react";
import type { UiColorToken } from "../../styles/color-token";

export type StatCardColor = "default" | "primary" | "danger" | "warning" | UiColorToken;
export type StatCardSize = "sm" | "md" | "lg";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  color?: StatCardColor;
  size?: StatCardSize;
  className?: string;
  style?: React.CSSProperties;
}
