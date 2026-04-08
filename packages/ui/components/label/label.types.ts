import * as LabelPrimitive from "@radix-ui/react-label";

export type LabelSize = "sm" | "md" | "lg";
export type LabelColor = "default" | "muted" | "danger";

export interface LabelProps extends LabelPrimitive.LabelProps {
  size?: LabelSize;
  color?: LabelColor;
  required?: boolean;
}
