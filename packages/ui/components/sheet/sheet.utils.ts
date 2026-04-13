import { SHEET_DEFAULTS, SHEET_HEIGHT_CLASS, SHEET_SIDE_CLASS, SHEET_SIZE_CLASS } from "./sheet.constants";
import type { SheetContentProps, SheetSide } from "./sheet.types";

export function getSheetContentClassName({
  side = SHEET_DEFAULTS.side,
  size = SHEET_DEFAULTS.size,
  scrollBehavior = SHEET_DEFAULTS.scrollBehavior
}: Pick<SheetContentProps, "side" | "size" | "scrollBehavior">) {
  const resolvedSide = side as SheetSide;
  const isVertical = resolvedSide === "left" || resolvedSide === "right";
  const isHorizontal = !isVertical;

  return [
    "bg-surface border-default fixed z-50 flex gap-4 border p-6 shadow-[var(--shadow-card)]",
    resolvedSide === "left"
      ? "rounded-r-[var(--radius-xl)]"
      : resolvedSide === "right"
        ? "rounded-l-[var(--radius-xl)]"
        : resolvedSide === "top"
          ? "rounded-b-[var(--radius-xl)]"
          : "rounded-t-[var(--radius-xl)]",
    "flex-col",
    SHEET_SIDE_CLASS[resolvedSide],
    isVertical ? SHEET_SIZE_CLASS[size ?? SHEET_DEFAULTS.size] : "",
    isHorizontal ? SHEET_HEIGHT_CLASS[size ?? SHEET_DEFAULTS.size] : "",
    scrollBehavior === "inside"
      ? "overflow-hidden [&_[data-sheet-body]]:min-h-0 [&_[data-sheet-body]]:flex-1 [&_[data-sheet-body]]:overflow-y-auto"
      : "overflow-y-auto"
  ]
    .filter(Boolean)
    .join(" ");
}
