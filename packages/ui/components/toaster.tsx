"use client";

import * as React from "react";
import { Toaster as SonnerToaster, toast } from "sonner";
import type { ToasterProps as SonnerToasterProps } from "sonner";

type UiAlertTone = "success" | "error" | "info" | "warning";
type UiAlertPayload = {
  message: string;
  tone?: UiAlertTone;
  durationMs?: number;
};

const UI_ALERT_EVENT_NAME = "repo:ui-alert";
const DEFAULT_DURATION_MS = 2600;
const DEFAULT_ERROR_DURATION_MS = 4200;

export interface ToasterProps {
  position?: SonnerToasterProps["position"];
  richColors?: boolean;
  closeButton?: boolean;
  expand?: boolean;
  visibleToasts?: number;
  offset?: SonnerToasterProps["offset"];
  mobileOffset?: SonnerToasterProps["mobileOffset"];
  theme?: SonnerToasterProps["theme"];
  invert?: SonnerToasterProps["invert"];
  durationMs?: number;
  errorDurationMs?: number;
  dedupe?: boolean;
  toastOptions?: SonnerToasterProps["toastOptions"];
}

export function Toaster({
  position = "top-center",
  richColors = true,
  closeButton = false,
  expand = false,
  visibleToasts = 4,
  durationMs = DEFAULT_DURATION_MS,
  errorDurationMs = DEFAULT_ERROR_DURATION_MS,
  dedupe = true,
  offset,
  mobileOffset,
  theme,
  invert,
  toastOptions
}: ToasterProps = {}) {
  const duplicateMapRef = React.useRef<Map<string, string>>(new Map());
  const duplicateTimerRef = React.useRef<Map<string, number>>(new Map());

  React.useEffect(() => {
    const listener = (event: Event) => {
      const custom = event as CustomEvent<UiAlertPayload>;
      const detail = custom.detail;
      if (!detail?.message) {
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const tone = detail.tone ?? "info";
      const resolvedDurationMs = detail.durationMs ?? (tone === "error" ? errorDurationMs : durationMs);
      const duplicateKey = `${tone}:${detail.message}`;
      const previousId = dedupe ? duplicateMapRef.current.get(duplicateKey) : undefined;
      if (previousId) toast.dismiss(previousId);

      const previousTimer = dedupe ? duplicateTimerRef.current.get(duplicateKey) : undefined;
      if (previousTimer) {
        window.clearTimeout(previousTimer);
      }

      const showToast = () => {
        if (tone === "success") {
          return toast.success(detail.message, { id, duration: resolvedDurationMs, closeButton: false });
        }
        if (tone === "error") {
          return toast.error(detail.message, { id, duration: resolvedDurationMs, closeButton: false });
        }
        if (tone === "warning") {
          return toast.warning(detail.message, { id, duration: resolvedDurationMs, closeButton: false });
        }
        return toast.info(detail.message, { id, duration: resolvedDurationMs, closeButton: false });
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

  return (
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
      style={
        {
          "--toast-close-button-start": "unset",
          "--toast-close-button-end": "8px",
          "--toast-close-button-transform": "translate(0, 0)"
        } as React.CSSProperties
      }
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
}
