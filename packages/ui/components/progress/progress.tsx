"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../cn";
import { PROGRESS_COLOR_CLASS, PROGRESS_DEFAULTS, PROGRESS_SIZE_CLASS } from "./progress.constants";
import type { ProgressProps } from "./progress.types";

const ProgressComponent = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  (
    {
      className,
      value,
      size = PROGRESS_DEFAULTS.size,
      color = PROGRESS_DEFAULTS.color,
      striped = PROGRESS_DEFAULTS.striped,
      showValue = PROGRESS_DEFAULTS.showValue,
      indeterminate = PROGRESS_DEFAULTS.indeterminate,
      label,
      ...props
    },
    ref
  ) => {
    const normalizedValue = Math.max(0, Math.min(100, value ?? 0));
    const indicatorStyle = React.useMemo<React.CSSProperties>(
      () => (indeterminate ? { width: "45%" } : { transform: `translateX(-${100 - normalizedValue}%)` }),
      [indeterminate, normalizedValue]
    );

    return (
      <div className="w-full">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            "bg-surface-elevated relative w-full overflow-hidden rounded-full",
            PROGRESS_SIZE_CLASS[size],
            className
          )}
          value={normalizedValue}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full w-full flex-1 transition-all",
              PROGRESS_COLOR_CLASS[color],
              indeterminate && "animate-pulse",
              striped && "bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.18)_25%,rgba(255,255,255,.18)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.18)_75%)] bg-[length:1rem_1rem]"
            )}
            style={indicatorStyle}
          />
        </ProgressPrimitive.Root>
        {showValue ? (
          <p className="text-caption text-muted mt-1 text-right">{indeterminate ? "..." : `${normalizedValue}%`}</p>
        ) : null}
        {label ? <p className="text-caption text-muted mt-1">{label}</p> : null}
      </div>
    );
  }
);
ProgressComponent.displayName = ProgressPrimitive.Root.displayName;

export const Progress = React.memo(ProgressComponent);
Progress.displayName = ProgressPrimitive.Root.displayName;
