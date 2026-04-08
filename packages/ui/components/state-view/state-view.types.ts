import * as React from "react";

export type StateVariant = "empty" | "error" | "warning" | "info" | "success" | "loading";
export type StateSize = "sm" | "md" | "lg";
export type StateAlign = "left" | "center";
export type StateLayout = "inline" | "stacked";

export interface StateViewProps {
  variant?: StateVariant;
  size?: StateSize;
  align?: StateAlign;
  layout?: StateLayout;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}
