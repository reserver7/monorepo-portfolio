import * as DialogPrimitive from "@radix-ui/react-dialog";

export type SheetSide = "top" | "right" | "bottom" | "left";
export type SheetSize = "sm" | "md" | "lg" | "xl";
export type SheetScrollBehavior = "inside" | "outside";

export interface SheetContentProps extends DialogPrimitive.DialogContentProps {
  side?: SheetSide;
  size?: SheetSize;
  scrollBehavior?: SheetScrollBehavior;
  showOverlay?: boolean;
  showCloseButton?: boolean;
  closeAriaLabel?: string;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  overlayClassName?: string;
}
