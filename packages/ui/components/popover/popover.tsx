"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { resolveOption } from "../internal/resolve-option";
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
  ) => {
    const resolvedSize = resolveOption(size, POPOVER_SIZE_CLASS, POPOVER_DEFAULTS.size);
    const resolvedVariant = resolveOption(variant, POPOVER_VARIANT_CLASS, POPOVER_DEFAULTS.variant);
    const resolvedAlign = resolveOption(align, { start: true, center: true, end: true }, POPOVER_DEFAULTS.align);
    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={ref}
          align={resolvedAlign}
          sideOffset={sideOffset}
          className={cn(
            "z-50 rounded-[var(--radius-md)] border p-4 shadow-card outline-none",
            POPOVER_SIZE_CLASS[resolvedSize],
            POPOVER_VARIANT_CLASS[resolvedVariant],
            className
          )}
          {...props}
        >
          {props.children}
          {withArrow ? <PopoverPrimitive.Arrow className="fill-surface-elevated" /> : null}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    );
  }
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
