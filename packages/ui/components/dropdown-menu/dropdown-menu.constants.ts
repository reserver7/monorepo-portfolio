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
  sm: "min-w-[10rem]",
  md: "min-w-[12rem]",
  lg: "min-w-[14rem]"
};

export const DROPDOWN_MENU_ITEM_SIZE_CLASS: Record<DropdownMenuItemSize, string> = {
  sm: "h-8 px-2 text-caption",
  md: "h-9 px-2 text-body-sm",
  lg: "h-10 px-3 text-body-sm"
};

export const DROPDOWN_MENU_LABEL_SIZE_CLASS: Record<DropdownMenuLabelSize, string> = {
  sm: "px-2 py-1 text-caption font-semibold",
  md: "px-2 py-1.5 text-body-sm font-semibold",
  lg: "px-3 py-2 text-body-sm font-semibold"
};

export const DROPDOWN_MENU_ITEM_COLOR_CLASS = {
  default: "text-foreground focus:bg-surface-elevated data-[state=open]:bg-surface-elevated",
  danger: "text-danger focus:bg-danger/10 data-[state=open]:bg-danger/10"
} as const;
