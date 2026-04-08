import type { ScrollBarSize } from "./scroll-area.types";

export const SCROLL_AREA_DEFAULTS = {
  scrollBarSize: "md"
} as const;

export const SCROLLBAR_SIZE_CLASS: Record<ScrollBarSize, { vertical: string; horizontal: string }> = {
  sm: {
    vertical: "w-2 p-[1px]",
    horizontal: "h-2 p-[1px]"
  },
  md: {
    vertical: "w-2.5 p-[1px]",
    horizontal: "h-2.5 p-[1px]"
  },
  lg: {
    vertical: "w-3 p-[2px]",
    horizontal: "h-3 p-[2px]"
  }
};
