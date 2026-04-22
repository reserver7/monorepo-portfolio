"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { resolveUiColorValue } from "../../styles/color-token";
import {
  DROPDOWN_MENU_CONTENT_SIZE_CLASS,
  DROPDOWN_MENU_DEFAULTS,
  DROPDOWN_MENU_ITEM_COLOR_CLASS,
  DROPDOWN_MENU_ITEM_SIZE_CLASS,
  DROPDOWN_MENU_LABEL_SIZE_CLASS
} from "./dropdown-menu.constants";
import type {
  DropdownMenuCheckboxItemProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuRadioItemProps,
  DropdownMenuSubTriggerProps
} from "./dropdown-menu.types";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  DropdownMenuSubTriggerProps
>(({ className, inset, size = DROPDOWN_MENU_DEFAULTS.itemSize, children, ...props }, ref) => {
  const resolvedSize = resolveOption(size, DROPDOWN_MENU_ITEM_SIZE_CLASS, DROPDOWN_MENU_DEFAULTS.itemSize);
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-[var(--radius-sm)] outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        DROPDOWN_MENU_ITEM_SIZE_CLASS[resolvedSize],
        DROPDOWN_MENU_ITEM_COLOR_CLASS.default,
        inset ? "pl-8" : null,
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-[var(--size-icon-md)] w-[var(--size-icon-md)] shrink-0 text-muted" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "border-default bg-surface z-50 min-w-[var(--size-dropdown-min-w)] overflow-hidden rounded-[var(--radius-lg)] border p-[var(--space-1)] shadow-card",
        className
      )}
      {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ className, sideOffset = DROPDOWN_MENU_DEFAULTS.sideOffset, size = DROPDOWN_MENU_DEFAULTS.contentSize, ...props }, ref) => {
  const resolvedSize = resolveOption(size, DROPDOWN_MENU_CONTENT_SIZE_CLASS, DROPDOWN_MENU_DEFAULTS.contentSize);
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "border-default bg-surface z-50 overflow-hidden rounded-[var(--radius-lg)] border p-[var(--space-1)] shadow-card",
          DROPDOWN_MENU_CONTENT_SIZE_CLASS[resolvedSize],
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(
  (
    {
      className,
      inset,
      size = DROPDOWN_MENU_DEFAULTS.itemSize,
      color = DROPDOWN_MENU_DEFAULTS.itemColor,
      keepOpenOnSelect,
      leftSlot,
      rightSlot,
      onSelect,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedSize = resolveOption(size, DROPDOWN_MENU_ITEM_SIZE_CLASS, DROPDOWN_MENU_DEFAULTS.itemSize);
    const hasPresetColor = Object.prototype.hasOwnProperty.call(DROPDOWN_MENU_ITEM_COLOR_CLASS, color);
    const resolvedColor = hasPresetColor
      ? (color as keyof typeof DROPDOWN_MENU_ITEM_COLOR_CLASS)
      : DROPDOWN_MENU_DEFAULTS.itemColor;
    const resolvedColorKey = resolvedColor as keyof typeof DROPDOWN_MENU_ITEM_COLOR_CLASS;
    const tokenColorValue = hasPresetColor ? undefined : resolveUiColorValue(color);
    return (
      <DropdownMenuPrimitive.Item
        ref={ref}
        onSelect={(event) => {
          if (keepOpenOnSelect) {
            event.preventDefault();
          }
          onSelect?.(event);
        }}
        className={cn(
          "relative flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          DROPDOWN_MENU_ITEM_SIZE_CLASS[resolvedSize],
          DROPDOWN_MENU_ITEM_COLOR_CLASS[resolvedColorKey],
          inset ? "pl-8" : null,
          className
        )}
        style={tokenColorValue ? { color: tokenColorValue } : undefined}
        {...props}
      >
        {leftSlot ? <span className="inline-flex h-[var(--size-icon-md)] w-[var(--size-icon-md)] items-center justify-center text-muted">{leftSlot}</span> : null}
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {rightSlot ? <span className="ml-auto inline-flex items-center text-muted">{rightSlot}</span> : null}
      </DropdownMenuPrimitive.Item>
    );
  }
);
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>(
  (
    {
      className,
      children,
      checked,
      size = DROPDOWN_MENU_DEFAULTS.itemSize,
      color = DROPDOWN_MENU_DEFAULTS.itemColor,
      keepOpenOnSelect,
      onSelect,
      ...props
    },
    ref
  ) => {
    const resolvedSize = resolveOption(size, DROPDOWN_MENU_ITEM_SIZE_CLASS, DROPDOWN_MENU_DEFAULTS.itemSize);
    const hasPresetColor = Object.prototype.hasOwnProperty.call(DROPDOWN_MENU_ITEM_COLOR_CLASS, color);
    const resolvedColor = hasPresetColor
      ? (color as keyof typeof DROPDOWN_MENU_ITEM_COLOR_CLASS)
      : DROPDOWN_MENU_DEFAULTS.itemColor;
    const resolvedColorKey = resolvedColor as keyof typeof DROPDOWN_MENU_ITEM_COLOR_CLASS;
    const tokenColorValue = hasPresetColor ? undefined : resolveUiColorValue(color);
    return (
      <DropdownMenuPrimitive.CheckboxItem
        ref={ref}
        checked={checked}
        onSelect={(event) => {
          if (keepOpenOnSelect) {
            event.preventDefault();
          }
          onSelect?.(event);
        }}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-[var(--radius-sm)] outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          DROPDOWN_MENU_ITEM_SIZE_CLASS[resolvedSize],
          DROPDOWN_MENU_ITEM_COLOR_CLASS[resolvedColorKey],
          "pl-8 pr-2",
          className
        )}
        style={tokenColorValue ? { color: tokenColorValue } : undefined}
        {...props}
      >
        <span className="absolute left-2 inline-flex h-[var(--size-icon-md)] w-[var(--size-icon-md)] items-center justify-center text-muted">
          <DropdownMenuPrimitive.ItemIndicator>
            <Check className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />
          </DropdownMenuPrimitive.ItemIndicator>
        </span>
        <span className="truncate">{children}</span>
      </DropdownMenuPrimitive.CheckboxItem>
    );
  }
);
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuRadioItemProps
>(
  (
    {
      className,
      children,
      size = DROPDOWN_MENU_DEFAULTS.itemSize,
      color = DROPDOWN_MENU_DEFAULTS.itemColor,
      keepOpenOnSelect,
      onSelect,
      ...props
    },
    ref
  ) => {
    const resolvedSize = resolveOption(size, DROPDOWN_MENU_ITEM_SIZE_CLASS, DROPDOWN_MENU_DEFAULTS.itemSize);
    const hasPresetColor = Object.prototype.hasOwnProperty.call(DROPDOWN_MENU_ITEM_COLOR_CLASS, color);
    const resolvedColor = hasPresetColor
      ? (color as keyof typeof DROPDOWN_MENU_ITEM_COLOR_CLASS)
      : DROPDOWN_MENU_DEFAULTS.itemColor;
    const resolvedColorKey = resolvedColor as keyof typeof DROPDOWN_MENU_ITEM_COLOR_CLASS;
    const tokenColorValue = hasPresetColor ? undefined : resolveUiColorValue(color);
    return (
      <DropdownMenuPrimitive.RadioItem
        ref={ref}
        onSelect={(event) => {
          if (keepOpenOnSelect) {
            event.preventDefault();
          }
          onSelect?.(event);
        }}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-[var(--radius-sm)] outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          DROPDOWN_MENU_ITEM_SIZE_CLASS[resolvedSize],
          DROPDOWN_MENU_ITEM_COLOR_CLASS[resolvedColorKey],
          "pl-8 pr-2",
          className
        )}
        style={tokenColorValue ? { color: tokenColorValue } : undefined}
        {...props}
      >
        <span className="absolute left-2 inline-flex h-[var(--size-icon-md)] w-[var(--size-icon-md)] items-center justify-center text-muted">
          <DropdownMenuPrimitive.ItemIndicator>
            <Circle className="h-2.5 w-2.5 fill-current" />
          </DropdownMenuPrimitive.ItemIndicator>
        </span>
        <span className="truncate">{children}</span>
      </DropdownMenuPrimitive.RadioItem>
    );
  }
);
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>(({ className, inset, size = DROPDOWN_MENU_DEFAULTS.labelSize, ...props }, ref) => {
  const resolvedSize = resolveOption(size, DROPDOWN_MENU_LABEL_SIZE_CLASS, DROPDOWN_MENU_DEFAULTS.labelSize);
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(DROPDOWN_MENU_LABEL_SIZE_CLASS[resolvedSize], inset ? "pl-8" : null, className)}
      {...props}
    />
  );
});
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator ref={ref} className={cn("bg-border -mx-1 my-1 h-px", className)} {...props} />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

export const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-caption tracking-wide text-muted", className)} {...props} />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
