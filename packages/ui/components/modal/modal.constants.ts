import type { ModalContentIntent, ModalContentSize } from "./modal.types";

export const MODAL_CONTENT_DEFAULTS = {
  size: "md" as ModalContentSize,
  intent: "default" as ModalContentIntent,
  preventEscapeClose: false,
  preventOutsideClose: false,
  hideCloseButton: false,
  closeAriaLabel: "닫기",
  scrollBehavior: "inside" as const
};

export const MODAL_FOOTER_DEFAULTS = {
  cancelText: "취소",
  confirmText: "확인",
  cancelVariant: "outline" as const,
  confirmVariant: "primary" as const,
  cancelDisabled: false,
  confirmDisabled: false,
  confirmLoading: false,
  closeOnConfirm: true,
  autoFocusButton: "none" as const,
  align: "end" as const,
  sticky: false,
  showCancelButton: true,
  showConfirmButton: true,
  fullWidthActions: false
};

export const MODAL_CONTENT_SIZE_CLASS: Record<ModalContentSize, string> = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "h-[calc(100vh-2rem)] max-w-none w-[calc(100vw-2rem)]"
};

export const MODAL_CONTENT_INTENT_CLASS: Record<ModalContentIntent, string> = {
  default: "",
  danger: "border-danger/40",
  warning: "border-warning/40",
  info: "border-primary/30"
};
