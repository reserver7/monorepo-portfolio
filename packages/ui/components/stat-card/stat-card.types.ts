import * as React from "react";

export type StatCardColor = "default" | "primary" | "danger" | "warning";
export type StatCardSize = "sm" | "md" | "lg";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  color?: StatCardColor;
  size?: StatCardSize;
  className?: string;
}
