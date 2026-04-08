"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../cn";
import { LABEL_COLOR_CLASS, LABEL_DEFAULTS, LABEL_SIZE_CLASS } from "./label.constants";
import type { LabelProps } from "./label.types";

const LabelComponent = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  (
    {
      className,
      size = LABEL_DEFAULTS.size,
      color = LABEL_DEFAULTS.color,
      required = LABEL_DEFAULTS.required,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <LabelPrimitive.Root
        ref={ref}
        className={cn("font-medium leading-none", LABEL_SIZE_CLASS[size], LABEL_COLOR_CLASS[color], className)}
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
