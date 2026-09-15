"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "../cn";

export type SpinSize = "sm" | "md" | "lg";
export type SpinColor = "default" | "primary" | "danger" | "success" | "warning";
export type SpinProps = {
  open?: boolean;
  fullscreen?: boolean;
  size?: SpinSize;
  color?: SpinColor;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  delayMs?: number;
};

const sizeClass: Record<SpinSize, string> = { sm: "size-4", md: "size-5", lg: "size-7" };
const colorClass: Record<SpinColor, string> = {
  default: "text-text-secondary",
  primary: "text-primary",
  danger: "text-danger",
  success: "text-success",
  warning: "text-warning"
};

export function Spin({
  open = true,
  fullscreen = false,
  size = "md",
  color = "default",
  label,
  className,
  style,
  delayMs = 0
}: SpinProps) {
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(open && delayMs <= 0);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    if (delayMs <= 0) {
      setVisible(true);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, open]);
  if (!visible) return null;
  const content = (
    <div
      className={cn("flex items-center gap-2", className)}
      style={style}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 aria-hidden className={cn("animate-spin", sizeClass[size], colorClass[color])} />
      {label ? <span className="text-body-sm text-muted">{label}</span> : null}
    </div>
  );
  if (!fullscreen) return content;
  const overlay = (
    <div
      className="bg-foreground/35 fixed inset-0 z-[1000] flex h-dvh w-dvw items-center justify-center backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={cn("flex flex-col items-center gap-2", className)} style={style}>
        <Loader2 aria-hidden className={cn("animate-spin", sizeClass[size], colorClass[color])} />
        {label ? <span className="text-body-sm text-primary-foreground">{label}</span> : null}
      </div>
    </div>
  );
  return mounted ? createPortal(overlay, document.body) : overlay;
}
