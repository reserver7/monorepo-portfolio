export type UiAlertColor = "success" | "error" | "info" | "warning";

export type UiAlertPayload = {
  message: string;
  color?: UiAlertColor;
  durationMs?: number;
};

export type UiToastInput = string | UiAlertPayload;

export const UI_ALERT_EVENT_NAME = "repo:ui-alert";

const toUiAlertPayload = (input: UiToastInput, color?: UiAlertColor, durationMs?: number): UiAlertPayload => {
  if (typeof input === "string") {
    return {
      message: input,
      color,
      durationMs
    };
  }
  return input;
};

export const notifyUiAlert = (payload: UiAlertPayload) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<UiAlertPayload>(UI_ALERT_EVENT_NAME, { detail: payload }));
};

type UiToastApi = ((input: UiToastInput) => void) & {
  success: (input: UiToastInput, durationMs?: number) => void;
  error: (input: UiToastInput, durationMs?: number) => void;
  info: (input: UiToastInput, durationMs?: number) => void;
  warning: (input: UiToastInput, durationMs?: number) => void;
};

export const toast = Object.assign(
  (input: UiToastInput) => notifyUiAlert(toUiAlertPayload(input)),
  {
    success: (input: UiToastInput, durationMs?: number) =>
      notifyUiAlert(toUiAlertPayload(input, "success", durationMs)),
    error: (input: UiToastInput, durationMs?: number) =>
      notifyUiAlert(toUiAlertPayload(input, "error", durationMs)),
    info: (input: UiToastInput, durationMs?: number) => notifyUiAlert(toUiAlertPayload(input, "info", durationMs)),
    warning: (input: UiToastInput, durationMs?: number) =>
      notifyUiAlert(toUiAlertPayload(input, "warning", durationMs))
  }
) as UiToastApi;

export const notifyUiSuccess = (message: string, durationMs?: number) =>
  toast.success(message, durationMs);

export const notifyUiError = (message: string, durationMs?: number) =>
  toast.error(message, durationMs);

export const notifyUiInfo = (message: string, durationMs?: number) =>
  toast.info(message, durationMs);

export const notifyUiWarning = (message: string, durationMs?: number) =>
  toast.warning(message, durationMs);
