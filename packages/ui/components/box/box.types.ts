import type * as React from "react";

export type BoxVariant = "plain" | "surface" | "elevated" | "muted";
export type BoxPadding = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export type BoxRadius = "none" | "sm" | "md" | "lg" | "xl" | "full";
export type BoxShadow = "none" | "sm" | "md" | "lg";

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BoxVariant;
  padding?: BoxPadding;
  radius?: BoxRadius;
  shadow?: BoxShadow;
  border?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
}

