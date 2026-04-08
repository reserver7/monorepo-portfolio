import * as SeparatorPrimitive from "@radix-ui/react-separator";

export type SeparatorColor = "default" | "subtle" | "strong" | "primary";
export type SeparatorThickness = "sm" | "md" | "lg";
export type SeparatorLineStyle = "solid" | "dashed" | "dotted";

export interface SeparatorProps extends SeparatorPrimitive.SeparatorProps {
  color?: SeparatorColor;
  inset?: "none" | "sm" | "md";
  thickness?: SeparatorThickness;
  lineStyle?: SeparatorLineStyle;
}
