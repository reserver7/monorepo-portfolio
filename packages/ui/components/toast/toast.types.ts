import type { ToasterProps as SonnerToasterProps } from "sonner";

export type ToastColor = "success" | "error" | "info" | "warning";

export interface ToastPayload {
  message: string;
  color?: ToastColor;
  durationMs?: number;
}

export type ToastInput = string | ToastPayload;

export interface ToastProps {
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
