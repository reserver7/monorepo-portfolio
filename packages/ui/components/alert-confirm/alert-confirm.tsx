"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Button, buttonVariants } from "../button";
import { cn } from "../cn";
import {
  ALERT_CONFIRM_CONTENT_DEFAULTS,
  ALERT_CONFIRM_CONTENT_INTENT_CLASS,
  ALERT_CONFIRM_CONTENT_SIZE_CLASS,
  ALERT_CONFIRM_FOOTER_DEFAULTS
} from "./alert-confirm-dialog.constants";
import { useBuiltInActions } from "./alert-confirm-dialog.hooks";
import type { AlertConfirmContentProps, AlertConfirmFooterProps } from "./alert-confirm-dialog.types";

export const AlertConfirm = AlertDialogPrimitive.Root;
export const AlertConfirmTrigger = AlertDialogPrimitive.Trigger;

export const AlertConfirmContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertConfirmContentProps
>(
  (
    {
      className,
      size = ALERT_CONFIRM_CONTENT_DEFAULTS.size,
      intent = ALERT_CONFIRM_CONTENT_DEFAULTS.intent,
      preventEscapeClose = ALERT_CONFIRM_CONTENT_DEFAULTS.preventEscapeClose,
      onEscapeKeyDown,
      ...props
    },
    ref
  ) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay className="bg-foreground/35 fixed inset-0 z-50 backdrop-blur-[1px] transition-opacity duration-200 data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
    <AlertDialogPrimitive.Content
      ref={ref}
      onEscapeKeyDown={(event) => {
        if (preventEscapeClose) {
          event.preventDefault();
        }
        onEscapeKeyDown?.(event);
      }}
      className={cn(
        "border-default bg-surface fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-lg",
        ALERT_CONFIRM_CONTENT_SIZE_CLASS[size],
        ALERT_CONFIRM_CONTENT_INTENT_CLASS[intent],
        className
      )}
      {...props}
    />
  </AlertDialogPrimitive.Portal>
));
AlertConfirmContent.displayName = AlertDialogPrimitive.Content.displayName;

export function AlertConfirmHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col space-y-1.5", className)} {...props} />;
}

export function AlertConfirmFooter({
  className,
  children,
  cancelText = ALERT_CONFIRM_FOOTER_DEFAULTS.cancelText,
  confirmText = ALERT_CONFIRM_FOOTER_DEFAULTS.confirmText,
  cancelVariant = ALERT_CONFIRM_FOOTER_DEFAULTS.cancelVariant,
  confirmVariant = ALERT_CONFIRM_FOOTER_DEFAULTS.confirmVariant,
  cancelDisabled = ALERT_CONFIRM_FOOTER_DEFAULTS.cancelDisabled,
  confirmDisabled = ALERT_CONFIRM_FOOTER_DEFAULTS.confirmDisabled,
  confirmLoading = ALERT_CONFIRM_FOOTER_DEFAULTS.confirmLoading,
  closeOnConfirm = ALERT_CONFIRM_FOOTER_DEFAULTS.closeOnConfirm,
  autoFocusButton = ALERT_CONFIRM_FOOTER_DEFAULTS.autoFocusButton,
  onCancel,
  onConfirm,
  ...props
}: AlertConfirmFooterProps) {
  const withBuiltInActions = useBuiltInActions(onCancel, onConfirm);

  return (
    <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props}>
      {withBuiltInActions ? (
        <>
          {onCancel ? (
            <AlertConfirmCancel asChild>
              <Button
                variant={cancelVariant}
                disabled={cancelDisabled}
                autoFocus={autoFocusButton === "cancel"}
                onClick={onCancel}
              >
                {cancelText}
              </Button>
            </AlertConfirmCancel>
          ) : null}
          {onConfirm ? (
            closeOnConfirm ? (
              <AlertConfirmAction asChild>
                <Button
                  variant={confirmVariant}
                  disabled={confirmDisabled}
                  loading={confirmLoading ? true : undefined}
                  autoFocus={autoFocusButton === "confirm"}
                  onClick={onConfirm}
                >
                  {confirmText}
                </Button>
              </AlertConfirmAction>
            ) : (
              <Button
                variant={confirmVariant}
                disabled={confirmDisabled}
                loading={confirmLoading ? true : undefined}
                autoFocus={autoFocusButton === "confirm"}
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            )
          ) : null}
        </>
      ) : (
        children
      )}
    </div>
  );
}

export const AlertConfirmTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn("text-foreground text-lg font-semibold", className)} {...props} />
));
AlertConfirmTitle.displayName = AlertDialogPrimitive.Title.displayName;

export const AlertConfirmDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={cn("text-muted text-sm", className)} {...props} />
));
AlertConfirmDescription.displayName = AlertDialogPrimitive.Description.displayName;

export function AlertConfirmAction({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>) {
  return <AlertDialogPrimitive.Action className={buttonVariants({ variant: "danger", className })} {...props} />;
}

export function AlertConfirmCancel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel className={buttonVariants({ variant: "secondary", className })} {...props} />;
}
