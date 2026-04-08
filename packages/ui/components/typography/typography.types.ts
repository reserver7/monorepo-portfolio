import type * as React from "react";

export type TypographyVariant = "h1" | "h2" | "h3" | "title" | "body" | "bodySm" | "caption" | "label";
export type TypographyColor = "default" | "muted" | "subtle" | "primary" | "success" | "warning" | "danger" | "info";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof React.JSX.IntrinsicElements;
  variant?: TypographyVariant;
  color?: TypographyColor;
}
