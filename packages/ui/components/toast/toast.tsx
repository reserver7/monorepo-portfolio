"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { TOAST_DEFAULTS, UI_ALERT_EVENT_NAME } from "./toast.constants";
import type { ToastInput, ToastPayload, ToastProps } from "./toast.types";

const TOASTER_PORTAL_STYLE: React.CSSProperties = {
  position: "fixed",
  zIndex: 9999,
  "--toast-close-button-start": "unset",
  "--toast-close-button-end": "8px",
  "--toast-close-button-transform": "translate(0, 0)"
} as React.CSSProperties;

const toToastPayload = (input: ToastInput, color?: ToastPayload["color"], durationMs?: number): ToastPayload => {
  if (typeof input === "string") {
    return {
      message: input,
      color,
      durationMs
    };
  }
  return input;
};

export const emitToast = (input: ToastInput, color?: ToastPayload["color"], durationMs?: number) => {
  if (typeof window === "undefined") {
    return;
  }
  const payload = toToastPayload(input, color, durationMs);
  if (!payload.message) {
    return;
  }
  window.dispatchEvent(new CustomEvent<ToastPayload>(UI_ALERT_EVENT_NAME, { detail: payload }));
};

type ToastApi = ((input: ToastInput) => void) & {
  success: (input: ToastInput, durationMs?: number) => void;
  error: (input: ToastInput, durationMs?: number) => void;
  info: (input: ToastInput, durationMs?: number) => void;
  warning: (input: ToastInput, durationMs?: number) => void;
};

export const toast = Object.assign(
  (input: ToastInput) => emitToast(input),
  {
    success: (input: ToastInput, durationMs?: number) => emitToast(input, "success", durationMs),
    error: (input: ToastInput, durationMs?: number) => emitToast(input, "error", durationMs),
    info: (input: ToastInput, durationMs?: number) => emitToast(input, "info", durationMs),
    warning: (input: ToastInput, durationMs?: number) => emitToast(input, "warning", durationMs)
  }
) as ToastApi;

export function Toast({
  position = TOAST_DEFAULTS.position,
  richColors = TOAST_DEFAULTS.richColors,
  closeButton = TOAST_DEFAULTS.closeButton,
  expand = TOAST_DEFAULTS.expand,
  visibleToasts = TOAST_DEFAULTS.visibleToasts,
  durationMs = TOAST_DEFAULTS.durationMs,
  errorDurationMs = TOAST_DEFAULTS.errorDurationMs,
  dedupe = TOAST_DEFAULTS.dedupe,
  offset,
  mobileOffset,
  theme,
  invert,
  toastOptions
}: ToastProps = {}) {
  const [mounted, setMounted] = React.useState(false);
  const duplicateMapRef = React.useRef<Map<string, string>>(new Map());
  const duplicateTimerRef = React.useRef<Map<string, number>>(new Map());

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const listener = (event: Event) => {
      const custom = event as CustomEvent<ToastPayload>;
      const detail = custom.detail;
      if (!detail?.message) {
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const color = detail.color ?? "info";
      const resolvedDurationMs = detail.durationMs ?? (color === "error" ? errorDurationMs : durationMs);
      const duplicateKey = `${color}:${detail.message}`;
      const previousId = dedupe ? duplicateMapRef.current.get(duplicateKey) : undefined;
      if (previousId) sonnerToast.dismiss(previousId);

      const previousTimer = dedupe ? duplicateTimerRef.current.get(duplicateKey) : undefined;
      if (previousTimer) {
        window.clearTimeout(previousTimer);
      }

      const showToast = () => {
        if (color === "success") {
          return sonnerToast.success(detail.message, { id, duration: resolvedDurationMs, closeButton: false });
        }
        if (color === "error") {
          return sonnerToast.error(detail.message, { id, duration: resolvedDurationMs, closeButton: false });
        }
        if (color === "warning") {
          return sonnerToast.warning(detail.message, { id, duration: resolvedDurationMs, closeButton: false });
        }
        return sonnerToast.info(detail.message, { id, duration: resolvedDurationMs, closeButton: false });
      };

      showToast();
      if (dedupe) {
        duplicateMapRef.current.set(duplicateKey, id);
        const cleanupTimer = window.setTimeout(() => {
          if (duplicateMapRef.current.get(duplicateKey) === id) {
            duplicateMapRef.current.delete(duplicateKey);
          }
          duplicateTimerRef.current.delete(duplicateKey);
        }, resolvedDurationMs + 150);
        duplicateTimerRef.current.set(duplicateKey, cleanupTimer);
      }
    };

    window.addEventListener(UI_ALERT_EVENT_NAME, listener as EventListener);
    return () => {
      window.removeEventListener(UI_ALERT_EVENT_NAME, listener as EventListener);
      duplicateTimerRef.current.forEach((timer) => window.clearTimeout(timer));
      duplicateTimerRef.current.clear();
      duplicateMapRef.current.clear();
    };
  }, [dedupe, durationMs, errorDurationMs]);

  const toaster = (
    <SonnerToaster
      position={position}
      richColors={richColors}
      closeButton={closeButton && false}
      expand={expand}
      visibleToasts={visibleToasts}
      offset={offset}
      mobileOffset={mobileOffset}
      theme={theme}
      invert={invert}
      className="!fixed !z-[9999]"
      style={TOASTER_PORTAL_STYLE}
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast:
            "relative justify-center rounded-lg border border-default bg-surface px-4 py-3 text-center text-foreground shadow-md [&_[data-content]]:mx-auto [&_[data-content]]:w-full [&_[data-description]]:text-center [&_[data-title]]:text-center",
          description: "text-muted text-center",
          ...toastOptions?.classNames
        }
      }}
    />
  );

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(toaster, document.body);
}
