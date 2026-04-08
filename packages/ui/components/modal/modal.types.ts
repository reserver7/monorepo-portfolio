import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ButtonProps } from "../button";

export type ModalContentSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";
export type ModalContentIntent = "default" | "danger" | "warning" | "info";
export type ModalScrollBehavior = "inside" | "outside";
export type ModalFooterAlign = "start" | "center" | "end" | "between";

export interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: ModalContentSize;
  intent?: ModalContentIntent;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  preventEscapeClose?: boolean;
  preventOutsideClose?: boolean;
  hideCloseButton?: boolean;
  closeAriaLabel?: string;
  overlayClassName?: string;
  scrollBehavior?: ModalScrollBehavior;
}

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  cancelText?: string;
  confirmText?: string;
  cancelVariant?: ButtonProps["variant"];
  confirmVariant?: ButtonProps["variant"];
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  closeOnConfirm?: boolean;
  autoFocusButton?: "confirm" | "cancel" | "none";
  align?: ModalFooterAlign;
  sticky?: boolean;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  fullWidthActions?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
}
