import type { AlertConfirmContentIntent, AlertConfirmContentSize } from "./alert-confirm-dialog.types";

export const ALERT_CONFIRM_CONTENT_DEFAULTS = {
  size: "md" as AlertConfirmContentSize,
  intent: "default" as AlertConfirmContentIntent,
  preventEscapeClose: false
};

export const ALERT_CONFIRM_FOOTER_DEFAULTS = {
  cancelText: "취소",
  confirmText: "삭제",
  cancelVariant: "secondary" as const,
  confirmVariant: "danger" as const,
  cancelDisabled: false,
  confirmDisabled: false,
  confirmLoading: false,
  closeOnConfirm: true,
  autoFocusButton: "confirm" as const
};

export const ALERT_CONFIRM_CONTENT_SIZE_CLASS: Record<AlertConfirmContentSize, string> = {
  sm: "max-w-[var(--size-modal-sm)]",
  md: "max-w-[var(--size-modal-md)]",
  lg: "max-w-[var(--size-modal-lg)]"
};

export const ALERT_CONFIRM_CONTENT_INTENT_CLASS: Record<AlertConfirmContentIntent, string> = {
  default: "",
  danger: "",
  warning: "",
  info: ""
};
