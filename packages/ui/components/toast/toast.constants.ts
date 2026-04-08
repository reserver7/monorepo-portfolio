export const UI_ALERT_EVENT_NAME = "repo:ui-alert";

export const TOAST_DEFAULTS = {
  position: "top-center",
  richColors: true,
  closeButton: false,
  expand: false,
  visibleToasts: 4,
  durationMs: 2600,
  errorDurationMs: 4200,
  dedupe: true
} as const;
