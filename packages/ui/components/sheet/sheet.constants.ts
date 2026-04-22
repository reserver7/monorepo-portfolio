import type { SheetScrollBehavior, SheetSide, SheetSize } from "./sheet.types";

export const SHEET_DEFAULTS = {
  side: "right",
  size: "md",
  scrollBehavior: "inside" as SheetScrollBehavior,
  showOverlay: true,
  showCloseButton: true,
  closeAriaLabel: "닫기",
  closeOnEscape: true,
  closeOnOutsideClick: true
} as const;

export const SHEET_SIDE_CLASS: Record<SheetSide, string> = {
  top: "inset-x-0 top-0 border-b",
  bottom: "inset-x-0 bottom-0 border-t",
  left: "inset-y-0 left-0 h-full border-r",
  right: "inset-y-0 right-0 h-full border-l"
};

export const SHEET_SIZE_CLASS: Record<SheetSize, string> = {
  sm: "w-full max-w-[min(var(--size-sheet-sm),calc(100vw-var(--space-4)))]",
  md: "w-full max-w-[min(var(--size-sheet-md),calc(100vw-var(--space-4)))]",
  lg: "w-full max-w-[min(var(--size-sheet-lg),calc(100vw-var(--space-4)))]",
  xl: "w-full max-w-[min(var(--size-sheet-xl),calc(100vw-var(--space-4)))]"
};

export const SHEET_HEIGHT_CLASS: Record<SheetSize, string> = {
  sm: "max-h-[var(--size-sheet-max-h-sm)]",
  md: "max-h-[var(--size-sheet-max-h-md)]",
  lg: "max-h-[var(--size-sheet-max-h-lg)]",
  xl: "max-h-[var(--size-sheet-max-h-xl)]"
};
