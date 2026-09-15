"use client";

import * as React from "react";
import { useControlledValue } from "../../hooks";
import { cn } from "../cn";
import type { RateProps } from "./rate.types";

export const Rate = React.forwardRef<HTMLDivElement, RateProps>(function Rate(
  {
    count = 5,
    value,
    defaultValue = 0,
    onChange,
    allowHalf = false,
    allowClear = true,
    character = "★",
    tooltips,
    disabled,
    className,
    ...props
  },
  ref
) {
  const [current, setCurrent] = useControlledValue({ value, defaultValue, onChange });
  const [hovered, setHovered] = React.useState<number | null>(null);
  const active = hovered ?? current;
  const step = allowHalf ? 0.5 : 1;
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label="Rating"
      className={cn("inline-flex items-center gap-1", disabled && "opacity-50", className)}
      {...props}
    >
      {Array.from({ length: count }, (_, index) => {
        const position = index + 1;
        const fillPercent = Math.max(0, Math.min(1, active - index)) * 100;
        return (
          <button
            key={position}
            type="button"
            role="radio"
            aria-checked={current === position || (allowHalf && current === position - 0.5)}
            aria-label={tooltips?.[index] ?? `${position} out of ${count}`}
            disabled={disabled}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const fraction = allowHalf && event.clientX - rect.left < rect.width / 2 ? 0.5 : 1;
              setHovered(index + fraction);
            }}
            onMouseLeave={() => setHovered(null)}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const next =
                allowHalf && event.clientX - rect.left < rect.width / 2 ? position - 0.5 : position;
              if (allowClear && current === next) setCurrent(0);
              else setCurrent(next);
            }}
            onKeyDown={(event) => {
              if (event.key === "Home") {
                event.preventDefault();
                setCurrent(0);
              } else if (event.key === "End") {
                event.preventDefault();
                setCurrent(count);
              } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                setCurrent(Math.min(count, current + step));
              } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                setCurrent(Math.max(0, current - step));
              }
            }}
            className="text-muted focus-visible:ring-primary relative cursor-pointer rounded text-xl leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
          >
            <span aria-hidden="true" className="relative inline-block">
              <span className={cn("block", fillPercent >= 100 && "text-warning")}>{character}</span>
              {fillPercent > 0 && fillPercent < 100 ? (
                <span
                  className="text-warning absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercent}%` }}
                >
                  {character}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
});
Rate.displayName = "Rate";
