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
  xs: "max-w-[var(--size-modal-xs)]",
  sm: "max-w-[var(--size-modal-sm)]",
  md: "max-w-[var(--size-modal-md)]",
  lg: "max-w-[var(--size-modal-lg)]",
  xl: "max-w-[var(--size-modal-xl)]",
  full: "h-[calc(100vh-var(--size-modal-viewport-inset))] max-w-none w-[calc(100vw-var(--size-modal-viewport-inset))]"
};

export const MODAL_CONTENT_INTENT_CLASS: Record<ModalContentIntent, string> = {
  default: "",
  danger: "border-danger/40",
  warning: "border-warning/40",
  info: "border-primary/30"
};
