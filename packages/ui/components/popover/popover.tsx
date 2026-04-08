"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../cn";
import { POPOVER_DEFAULTS, POPOVER_SIZE_CLASS, POPOVER_VARIANT_CLASS } from "./popover.constants";
import type { PopoverContentProps } from "./popover.types";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      align = POPOVER_DEFAULTS.align,
      sideOffset = POPOVER_DEFAULTS.sideOffset,
      size = POPOVER_DEFAULTS.size,
      variant = POPOVER_DEFAULTS.variant,
      withArrow = POPOVER_DEFAULTS.withArrow,
      ...props
    },
    ref
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-md border p-4 shadow-md outline-none",
          POPOVER_SIZE_CLASS[size],
          POPOVER_VARIANT_CLASS[variant],
          className
        )}
        {...props}
      >
        {props.children}
        {withArrow ? <PopoverPrimitive.Arrow className="fill-surface-elevated" /> : null}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
