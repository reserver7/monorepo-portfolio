import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ButtonProps } from "../button";

export type AlertConfirmContentSize = "sm" | "md" | "lg";
export type AlertConfirmContentIntent = "default" | "danger" | "warning" | "info";

export interface AlertConfirmContentProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> {
  size?: AlertConfirmContentSize;
  intent?: AlertConfirmContentIntent;
  preventEscapeClose?: boolean;
}

export interface AlertConfirmFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  cancelText?: string;
  confirmText?: string;
  cancelVariant?: ButtonProps["variant"];
  confirmVariant?: ButtonProps["variant"];
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  closeOnConfirm?: boolean;
  autoFocusButton?: "confirm" | "cancel" | "none";
  onCancel?: () => void;
  onConfirm?: () => void;
}
