"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { resolveUiColorValue } from "../../styles/color-token";
import {
  SEPARATOR_BORDER_COLOR_CLASS,
  SEPARATOR_COLOR_CLASS,
  SEPARATOR_DEFAULTS,
  SEPARATOR_INSET_CLASS,
  SEPARATOR_LINE_STYLE_CLASS,
  SEPARATOR_THICKNESS_CLASS
} from "./separator.constants";
import type { SeparatorProps } from "./separator.types";

const SeparatorComponent = React.forwardRef<React.ElementRef<typeof SeparatorPrimitive.Root>, SeparatorProps>(
  (
    {
      className,
      orientation = "horizontal",
      decorative = true,
      color = SEPARATOR_DEFAULTS.color,
      inset = SEPARATOR_DEFAULTS.inset,
      thickness = SEPARATOR_DEFAULTS.thickness,
      lineStyle = SEPARATOR_DEFAULTS.lineStyle,
      ...props
    },
    ref
  ) => {
    const resolvedOrientation = resolveOption(orientation, { horizontal: true, vertical: true }, "horizontal");
    const hasPresetColor = Object.prototype.hasOwnProperty.call(SEPARATOR_COLOR_CLASS, color);
    const resolvedColor = hasPresetColor
      ? resolveOption(color as keyof typeof SEPARATOR_COLOR_CLASS, SEPARATOR_COLOR_CLASS, SEPARATOR_DEFAULTS.color)
      : SEPARATOR_DEFAULTS.color;
    const tokenColorValue = hasPresetColor ? undefined : resolveUiColorValue(color);
    const resolvedInset = resolveOption(inset, SEPARATOR_INSET_CLASS, SEPARATOR_DEFAULTS.inset);
    const resolvedThickness = resolveOption(thickness, SEPARATOR_THICKNESS_CLASS, SEPARATOR_DEFAULTS.thickness);
    const resolvedLineStyle = resolveOption(lineStyle, SEPARATOR_LINE_STYLE_CLASS, SEPARATOR_DEFAULTS.lineStyle);
    const isHorizontal = resolvedOrientation === "horizontal";

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={resolvedOrientation}
        className={cn(
          "shrink-0",
          resolvedLineStyle === "solid" ? SEPARATOR_COLOR_CLASS[resolvedColor] : SEPARATOR_BORDER_COLOR_CLASS[resolvedColor],
          resolvedLineStyle === "solid" ? "border-0" : SEPARATOR_LINE_STYLE_CLASS[resolvedLineStyle],
          isHorizontal ? "w-full" : "h-full",
          isHorizontal ? SEPARATOR_THICKNESS_CLASS[resolvedThickness].horizontal : SEPARATOR_THICKNESS_CLASS[resolvedThickness].vertical,
          resolvedLineStyle !== "solid" && (isHorizontal ? "border-t" : "border-l"),
          isHorizontal && SEPARATOR_INSET_CLASS[resolvedInset],
          className
        )}
        style={
          tokenColorValue
            ? resolvedLineStyle === "solid"
              ? { backgroundColor: tokenColorValue }
              : isHorizontal
                ? { borderTopColor: tokenColorValue }
                : { borderLeftColor: tokenColorValue }
            : undefined
        }
        {...props}
      />
    );
  }
);
SeparatorComponent.displayName = SeparatorPrimitive.Root.displayName;

export const Separator = React.memo(SeparatorComponent);
Separator.displayName = SeparatorPrimitive.Root.displayName;
