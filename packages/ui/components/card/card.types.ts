import * as React from "react";

export type CardVariant = "default" | "elevated" | "muted" | "ghost";
export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardRadius = "md" | "lg" | "xl";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  padding?: CardPadding;
  radius?: CardRadius;
  bordered?: boolean;
}

export interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}
