import type { ButtonProps } from "../button";

export const UI_ALERT_CONFIRM_EVENT_NAME = "repo-ui:alert-confirm-request";

export const ALERT_CONFIRM_DEFAULTS = {
  titleAlert: "알림",
  titleConfirm: "확인",
  confirmText: "확인",
  cancelText: "취소",
  confirmVariant: "primary" as ButtonProps["variant"],
  cancelVariant: "outline" as ButtonProps["variant"]
} as const;
