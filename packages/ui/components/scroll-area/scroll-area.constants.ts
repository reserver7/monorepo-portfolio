import type { ScrollBarSize } from "./scroll-area.types";

export const SCROLL_AREA_DEFAULTS = {
  scrollBarSize: "md"
} as const;

export const SCROLLBAR_SIZE_CLASS: Record<ScrollBarSize, { vertical: string; horizontal: string }> = {
  sm: {
    vertical: "w-[var(--size-scrollbar-sm)] p-[var(--size-border-hairline)]",
    horizontal: "h-[var(--size-scrollbar-sm)] p-[var(--size-border-hairline)]"
  },
  md: {
    vertical: "w-[var(--size-scrollbar-md)] p-[var(--size-border-hairline)]",
    horizontal: "h-[var(--size-scrollbar-md)] p-[var(--size-border-hairline)]"
  },
  lg: {
    vertical: "w-[var(--size-scrollbar-lg)] p-[var(--size-border-thin)]",
    horizontal: "h-[var(--size-scrollbar-lg)] p-[var(--size-border-thin)]"
  }
};
