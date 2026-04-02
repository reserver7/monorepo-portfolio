"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

type SpinnerSize = "sm" | "md" | "lg";
type SpinnerTone = "default" | "primary" | "danger";

export interface SpinnerProps {
  open?: boolean;
  fullscreen?: boolean;
  size?: SpinnerSize;
  tone?: SpinnerTone;
  label?: string;
  className?: string;
  delayMs?: number;
}

export function Spinner({
  open = true,
  fullscreen = false,
  size = "md",
  tone = "default",
  label,
  className,
  delayMs
}: SpinnerProps) {
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

  const bySize: Record<SpinnerSize, string> = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };
  const byTone: Record<SpinnerTone, string> = {
    default: "text-muted",
    primary: "text-primary",
    danger: "text-danger"
  };

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", bySize[size], byTone[tone])} />
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
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={cn("animate-spin", bySize[size], byTone[tone])} />
        {label ? <span className="text-body-sm text-primary-foreground">{label}</span> : null}
      </div>
    </div>
  );
}
