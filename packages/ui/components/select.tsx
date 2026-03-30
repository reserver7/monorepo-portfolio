"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "./cn";

type TriggerSize = "sm" | "md" | "lg";
type TriggerVariant = "default" | "filled" | "ghost";
type TriggerState = "default" | "error" | "success";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: TriggerSize;
    variant?: TriggerVariant;
    state?: TriggerState;
  }
>(({ className, children, size = "md", variant = "default", state = "default", ...props }, ref) => {
  const bySize: Record<TriggerSize, string> = { sm: "h-9 text-body-sm", md: "h-10 text-body-md", lg: "h-11 text-body-md" };
  const byVariant: Record<TriggerVariant, string> = {
    default: "border-default bg-surface",
    filled: "border-transparent bg-surface-elevated",
    ghost: "border-transparent bg-transparent"
  };
  const byState: Record<TriggerState, string> = {
    default: "focus:border-primary focus:ring-primary/20",
    error: "border-danger/40 focus:border-danger focus:ring-danger/20",
    success: "border-success/40 focus:border-success focus:ring-success/20"
  };
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex w-full items-center justify-between rounded-md border px-3 py-2 text-foreground outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        bySize[size],
        byVariant[variant],
        byState[state],
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 text-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border border-default bg-surface shadow-md", className)}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex h-9 w-full cursor-default select-none items-center rounded-sm pl-8 pr-2 text-body-sm leading-none outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-elevated",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
