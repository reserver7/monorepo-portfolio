import type * as React from "react";

export type BoxVariant = "plain" | "surface" | "elevated" | "muted";
export type BoxPadding = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export type BoxRadius = "none" | "sm" | "md" | "lg" | "xl" | "full";
export type BoxShadow = "none" | "sm" | "md" | "lg";
export type BoxAs =
  | "div"
  | "section"
  | "header"
  | "main"
  | "aside"
  | "nav"
  | "span"
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  as?: BoxAs;
  variant?: BoxVariant;
  padding?: BoxPadding;
  radius?: BoxRadius;
  shadow?: BoxShadow;
  border?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
}
