import * as PopoverPrimitive from "@radix-ui/react-popover";

export type PopoverSize = "sm" | "md" | "lg";
export type PopoverVariant = "default" | "elevated";

export interface PopoverContentProps extends PopoverPrimitive.PopoverContentProps {
  size?: PopoverSize;
  variant?: PopoverVariant;
  withArrow?: boolean;
}
