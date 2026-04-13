import type * as React from "react";
import type { PrimitiveColorToken, SemanticColorToken } from "../../styles/color-token";

export type TypographyVariant =
  | "headingXl"
  | "headingLg"
  | "headingMd"
  | "title"
  | "bodyMd"
  | "bodySm"
  | "caption"
  | "micro"
  | "label"
  | "h1"
  | "h2"
  | "h3"
  | "body";

type TypographySemanticColor = "default" | SemanticColorToken;
export type TypographyColor = TypographySemanticColor | PrimitiveColorToken;

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof React.JSX.IntrinsicElements;
  variant?: TypographyVariant;
  color?: TypographyColor;
}
