"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../cn";
import { TOOLTIP_ARROW_CLASS, TOOLTIP_COLOR_CLASS, TOOLTIP_DEFAULTS, TOOLTIP_SIZE_CLASS } from "./tooltip.constants";
import type { TooltipContentProps } from "./tooltip.types";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, TooltipContentProps>(
  (
    {
      className,
      placement = TOOLTIP_DEFAULTS.placement,
      alignment = TOOLTIP_DEFAULTS.alignment,
      offset = TOOLTIP_DEFAULTS.offset,
      side,
      align,
      sideOffset,
      size = TOOLTIP_DEFAULTS.size,
      color = TOOLTIP_DEFAULTS.color,
      withArrow = TOOLTIP_DEFAULTS.withArrow,
      ...props
    },
    ref
  ) => {
    const resolvedSide = side ?? placement;
    const resolvedAlign = align ?? alignment;
    const resolvedOffset = sideOffset ?? offset;

    return (
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={ref}
          side={resolvedSide}
          align={resolvedAlign}
          sideOffset={resolvedOffset}
          className={cn(
            "z-50 overflow-hidden rounded-md shadow-md",
            TOOLTIP_SIZE_CLASS[size],
            TOOLTIP_COLOR_CLASS[color],
            className
          )}
          {...props}
        >
          {props.children}
          {withArrow ? <TooltipPrimitive.Arrow className={cn(TOOLTIP_ARROW_CLASS[color])} /> : null}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    );
  }
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
