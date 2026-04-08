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
  sm: "w-3/4 sm:max-w-sm",
  md: "w-3/4 sm:max-w-md",
  lg: "w-4/5 sm:max-w-lg",
  xl: "w-5/6 sm:max-w-xl"
};

export const SHEET_HEIGHT_CLASS: Record<SheetSize, string> = {
  sm: "max-h-[40vh]",
  md: "max-h-[50vh]",
  lg: "max-h-[60vh]",
  xl: "max-h-[70vh]"
};
