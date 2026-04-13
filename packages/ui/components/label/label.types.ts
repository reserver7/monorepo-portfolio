import * as LabelPrimitive from "@radix-ui/react-label";
import type { UiColorToken } from "../../styles/color-token";

export type LabelSize = "sm" | "md" | "lg";
export type LabelColor = "default" | "muted" | "danger" | UiColorToken;

export interface LabelProps extends LabelPrimitive.LabelProps {
  size?: LabelSize;
  color?: LabelColor;
  required?: boolean;
}
