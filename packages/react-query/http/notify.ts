export type UiAlertTone = "success" | "error" | "info" | "warning";

export type UiAlertPayload = {
  message: string;
  tone?: UiAlertTone;
  durationMs?: number;
};

export const UI_ALERT_EVENT_NAME = "repo:ui-alert";

export const notifyUiAlert = (payload: UiAlertPayload) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<UiAlertPayload>(UI_ALERT_EVENT_NAME, { detail: payload }));
};

export const notifyUiSuccess = (message: string, durationMs?: number) =>
  notifyUiAlert({ message, tone: "success", durationMs });

export const notifyUiError = (message: string, durationMs?: number) =>
  notifyUiAlert({ message, tone: "error", durationMs });

export const notifyUiInfo = (message: string, durationMs?: number) =>
  notifyUiAlert({ message, tone: "info", durationMs });

export const notifyUiWarning = (message: string, durationMs?: number) =>
  notifyUiAlert({ message, tone: "warning", durationMs });

