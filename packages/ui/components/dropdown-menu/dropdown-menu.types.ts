import type * as React from "react";
import type * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

export type DropdownMenuContentSize = "sm" | "md" | "lg";
export type DropdownMenuItemSize = "sm" | "md" | "lg";
export type DropdownMenuLabelSize = "sm" | "md" | "lg";
export type DropdownMenuItemColor = "default" | "danger";

export interface DropdownMenuContentProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
  size?: DropdownMenuContentSize;
}

export interface DropdownMenuSubTriggerProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> {
  inset?: boolean;
  size?: DropdownMenuItemSize;
}

export interface DropdownMenuItemProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
  size?: DropdownMenuItemSize;
  color?: DropdownMenuItemColor;
  keepOpenOnSelect?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export interface DropdownMenuCheckboxItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> {
  size?: DropdownMenuItemSize;
  color?: DropdownMenuItemColor;
  keepOpenOnSelect?: boolean;
}

export interface DropdownMenuRadioItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> {
  size?: DropdownMenuItemSize;
  color?: DropdownMenuItemColor;
  keepOpenOnSelect?: boolean;
}

export interface DropdownMenuLabelProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> {
  inset?: boolean;
  size?: DropdownMenuLabelSize;
}
