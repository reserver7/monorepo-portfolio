"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { resolveUiColorValue } from "../../styles/color-token";
import { SPINNER_COLOR_CLASS, SPINNER_DEFAULTS, SPINNER_SIZE_CLASS } from "./spinner.constants";
import type { SpinnerProps } from "./spinner.types";

export const Spinner = React.memo(function Spinner({
  open = SPINNER_DEFAULTS.open,
  fullscreen = SPINNER_DEFAULTS.fullscreen,
  size = SPINNER_DEFAULTS.size,
  color = SPINNER_DEFAULTS.color,
  label,
  className,
  style,
  delayMs
}: SpinnerProps) {
  const resolvedSize = resolveOption(size, SPINNER_SIZE_CLASS, SPINNER_DEFAULTS.size);
  const hasPresetColor = Object.prototype.hasOwnProperty.call(SPINNER_COLOR_CLASS, color);
  const resolvedColor = hasPresetColor
    ? resolveOption(color as keyof typeof SPINNER_COLOR_CLASS, SPINNER_COLOR_CLASS, SPINNER_DEFAULTS.color)
    : SPINNER_DEFAULTS.color;
  const tokenColorValue = hasPresetColor ? undefined : resolveUiColorValue(color);
  const resolvedDelayMs = delayMs ?? (fullscreen ? 300 : 0);
  const [visible, setVisible] = React.useState(
    () => (open && resolvedDelayMs === 0) || (open && !fullscreen)
  );

  React.useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    if (resolvedDelayMs <= 0) {
      setVisible(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, resolvedDelayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, resolvedDelayMs]);

  if (!visible) return null;

  const content = (
    <div className={cn("flex items-center gap-2", className)} style={style}>
      <Loader2
        className={cn("animate-spin", SPINNER_SIZE_CLASS[resolvedSize], SPINNER_COLOR_CLASS[resolvedColor])}
        style={tokenColorValue ? { color: tokenColorValue } : undefined}
      />
      {label ? <span className="text-body-sm text-muted">{label}</span> : null}
    </div>
  );

  if (!fullscreen) return content;

  return (
    <div
      className="bg-foreground/35 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={cn("flex flex-col items-center gap-2", className)} style={style}>
        <Loader2
          className={cn("animate-spin", SPINNER_SIZE_CLASS[resolvedSize], SPINNER_COLOR_CLASS[resolvedColor])}
          style={tokenColorValue ? { color: tokenColorValue } : undefined}
        />
        {label ? <span className="text-body-sm text-primary-foreground">{label}</span> : null}
      </div>
    </div>
  );
});
Spinner.displayName = "Spinner";
