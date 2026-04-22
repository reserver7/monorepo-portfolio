import type {
  DropdownMenuContentSize,
  DropdownMenuItemColor,
  DropdownMenuItemSize,
  DropdownMenuLabelSize
} from "./dropdown-menu.types";

export const DROPDOWN_MENU_DEFAULTS = {
  contentSize: "md" as DropdownMenuContentSize,
  itemSize: "md" as DropdownMenuItemSize,
  labelSize: "md" as DropdownMenuLabelSize,
  itemColor: "default" as DropdownMenuItemColor,
  sideOffset: 6
};

export const DROPDOWN_MENU_CONTENT_SIZE_CLASS: Record<DropdownMenuContentSize, string> = {
  sm: "min-w-[var(--size-dropdown-content-sm)]",
  md: "min-w-[var(--size-dropdown-content-md)]",
  lg: "min-w-[var(--size-dropdown-content-lg)]"
};

export const DROPDOWN_MENU_ITEM_SIZE_CLASS: Record<DropdownMenuItemSize, string> = {
  sm: "h-[var(--size-control-sm)] px-[var(--space-2)] text-caption",
  md: "h-[var(--size-control-md)] px-[var(--space-2)] text-body-sm",
  lg: "h-[var(--size-control-lg)] px-[var(--space-3)] text-body-sm"
};

export const DROPDOWN_MENU_LABEL_SIZE_CLASS: Record<DropdownMenuLabelSize, string> = {
  sm: "px-[var(--space-2)] py-[var(--space-1)] text-caption font-semibold",
  md: "px-[var(--space-2)] py-[var(--space-1-5)] text-body-sm font-semibold",
  lg: "px-[var(--space-3)] py-[var(--space-2)] text-body-sm font-semibold"
};

export const DROPDOWN_MENU_ITEM_COLOR_CLASS = {
  default: "text-foreground focus:bg-surface-elevated data-[state=open]:bg-surface-elevated",
  danger: "text-danger focus:bg-danger/10 data-[state=open]:bg-danger/10"
} as const;
