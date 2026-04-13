"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { resolveUiColorValue } from "../../styles/color-token";
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
      style,
      ...props
    },
    ref
  ) => {
    const resolvedSide = resolveOption(side ?? placement, { top: true, right: true, bottom: true, left: true }, TOOLTIP_DEFAULTS.placement);
    const resolvedAlign = resolveOption(align ?? alignment, { start: true, center: true, end: true }, TOOLTIP_DEFAULTS.alignment);
    const resolvedOffset = sideOffset ?? offset;
    const resolvedSize = resolveOption(size, TOOLTIP_SIZE_CLASS, TOOLTIP_DEFAULTS.size);
    const hasPresetColor = Object.prototype.hasOwnProperty.call(TOOLTIP_COLOR_CLASS, color);
    const resolvedColor = hasPresetColor
      ? resolveOption(color as keyof typeof TOOLTIP_COLOR_CLASS, TOOLTIP_COLOR_CLASS, TOOLTIP_DEFAULTS.color)
      : TOOLTIP_DEFAULTS.color;
    const tokenColorValue = hasPresetColor ? undefined : resolveUiColorValue(color);

    return (
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={ref}
          side={resolvedSide}
          align={resolvedAlign}
          sideOffset={resolvedOffset}
          className={cn(
            "z-50 overflow-hidden rounded-[var(--radius-md)] shadow-card",
            TOOLTIP_SIZE_CLASS[resolvedSize],
            TOOLTIP_COLOR_CLASS[resolvedColor],
            className
          )}
          style={
            tokenColorValue
              ? {
                  ...(style ?? {}),
                  backgroundColor: tokenColorValue,
                  color: "#fff"
                }
              : style
          }
          {...props}
        >
          {props.children}
          {withArrow ? (
            <TooltipPrimitive.Arrow
              className={cn(TOOLTIP_ARROW_CLASS[resolvedColor])}
              style={tokenColorValue ? { fill: tokenColorValue } : undefined}
            />
          ) : null}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    );
  }
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
