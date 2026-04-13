import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { UiColorToken } from "../../styles/color-token";

export type TooltipSize = "sm" | "md" | "lg";
export type TooltipColor = "default" | "inverse" | "primary" | UiColorToken;
export type TooltipPlacement = "top" | "right" | "bottom" | "left";
export type TooltipAlignment = "start" | "center" | "end";

export interface TooltipContentProps extends TooltipPrimitive.TooltipContentProps {
  size?: TooltipSize;
  color?: TooltipColor;
  withArrow?: boolean;
  placement?: TooltipPlacement;
  alignment?: TooltipAlignment;
  offset?: number;
}
