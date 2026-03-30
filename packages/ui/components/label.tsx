"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "./cn";

type LabelSize = "sm" | "md" | "lg";

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  size?: LabelSize;
}

export const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, size = "md", ...props }, ref) => {
    const bySize: Record<LabelSize, string> = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base"
    };

    return (
      <LabelPrimitive.Root
        ref={ref}
        className={cn("text-foreground font-medium leading-none", bySize[size], className)}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";
