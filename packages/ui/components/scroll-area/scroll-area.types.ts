import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

export type ScrollBarSize = "sm" | "md" | "lg";

export interface ScrollAreaProps extends ScrollAreaPrimitive.ScrollAreaProps {
  viewportClassName?: string;
  scrollBarSize?: ScrollBarSize;
}

export interface ScrollBarProps extends ScrollAreaPrimitive.ScrollAreaScrollbarProps {
  size?: ScrollBarSize;
}
