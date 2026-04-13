"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { resolveUiColorValue } from "../../styles/color-token";
import { LABEL_COLOR_CLASS, LABEL_DEFAULTS, LABEL_SIZE_CLASS } from "./label.constants";
import type { LabelProps } from "./label.types";

const LabelComponent = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  (
    {
      className,
      style,
      size = LABEL_DEFAULTS.size,
      color = LABEL_DEFAULTS.color,
      required = LABEL_DEFAULTS.required,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedSize = resolveOption(size, LABEL_SIZE_CLASS, LABEL_DEFAULTS.size);
    const hasPresetColor = Object.prototype.hasOwnProperty.call(LABEL_COLOR_CLASS, color);
    const resolvedColor = hasPresetColor
      ? resolveOption(color as keyof typeof LABEL_COLOR_CLASS, LABEL_COLOR_CLASS, LABEL_DEFAULTS.color)
      : LABEL_DEFAULTS.color;
    const tokenColorValue = hasPresetColor ? undefined : resolveUiColorValue(color);

    return (
      <LabelPrimitive.Root
        ref={ref}
        className={cn("font-medium leading-none", LABEL_SIZE_CLASS[resolvedSize], LABEL_COLOR_CLASS[resolvedColor], className)}
        style={tokenColorValue ? { ...(style ?? {}), color: tokenColorValue } : style}
        {...props}
      >
        {children}
        {required ? <span className="text-danger ml-1">*</span> : null}
      </LabelPrimitive.Root>
    );
  }
);
LabelComponent.displayName = "Label";

export const Label = React.memo(LabelComponent);
Label.displayName = "Label";
