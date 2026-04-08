"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "../cn";
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
    const isHorizontal = orientation === "horizontal";

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "shrink-0",
          lineStyle === "solid" ? SEPARATOR_COLOR_CLASS[color] : SEPARATOR_BORDER_COLOR_CLASS[color],
          lineStyle === "solid" ? "border-0" : SEPARATOR_LINE_STYLE_CLASS[lineStyle],
          isHorizontal ? "w-full" : "h-full",
          isHorizontal ? SEPARATOR_THICKNESS_CLASS[thickness].horizontal : SEPARATOR_THICKNESS_CLASS[thickness].vertical,
          lineStyle !== "solid" && (isHorizontal ? "border-t" : "border-l"),
          isHorizontal && SEPARATOR_INSET_CLASS[inset],
          className
        )}
        {...props}
      />
    );
  }
);
SeparatorComponent.displayName = SeparatorPrimitive.Root.displayName;

export const Separator = React.memo(SeparatorComponent);
Separator.displayName = SeparatorPrimitive.Root.displayName;
