"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "../button";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import {
  MODAL_CONTENT_DEFAULTS,
  MODAL_CONTENT_INTENT_CLASS,
  MODAL_CONTENT_SIZE_CLASS,
  MODAL_FOOTER_DEFAULTS
} from "./modal.constants";
import { useBuiltInModalActions } from "./modal.hooks";
import type { ModalContentProps, ModalFooterProps } from "./modal.types";

export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;

export const ModalContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, ModalContentProps>(
  (
    {
      className,
      children,
      size = MODAL_CONTENT_DEFAULTS.size,
      intent = MODAL_CONTENT_DEFAULTS.intent,
      closeOnEscape,
      closeOnOutsideClick,
      preventEscapeClose = MODAL_CONTENT_DEFAULTS.preventEscapeClose,
      preventOutsideClose = MODAL_CONTENT_DEFAULTS.preventOutsideClose,
      hideCloseButton = MODAL_CONTENT_DEFAULTS.hideCloseButton,
      closeAriaLabel = MODAL_CONTENT_DEFAULTS.closeAriaLabel,
      overlayClassName,
      scrollBehavior = MODAL_CONTENT_DEFAULTS.scrollBehavior,
      onEscapeKeyDown,
      onPointerDownOutside,
      ...props
    },
    ref
  ) => {
    const allowEscapeClose = closeOnEscape ?? !preventEscapeClose;
    const allowOutsideClose = closeOnOutsideClick ?? !preventOutsideClose;
    const resolvedSize = resolveOption(size, MODAL_CONTENT_SIZE_CLASS, MODAL_CONTENT_DEFAULTS.size);
    const resolvedIntent = resolveOption(intent, MODAL_CONTENT_INTENT_CLASS, MODAL_CONTENT_DEFAULTS.intent);
    const resolvedScrollBehavior = resolveOption(scrollBehavior, { inside: true, outside: true }, MODAL_CONTENT_DEFAULTS.scrollBehavior);

    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/55 backdrop-blur-[10px] backdrop-saturate-150 transition-opacity duration-200 data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
            overlayClassName
          )}
        />
      <DialogPrimitive.Content
        ref={ref}
        onEscapeKeyDown={(event) => {
          if (!allowEscapeClose) {
            event.preventDefault();
          }
          onEscapeKeyDown?.(event);
        }}
        onPointerDownOutside={(event) => {
          if (!allowOutsideClose) {
            event.preventDefault();
          }
          onPointerDownOutside?.(event);
        }}
        className={cn(
          "border-default bg-surface fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] border p-[var(--space-6)] shadow-[var(--shadow-card)]",
          resolvedScrollBehavior === "inside" &&
            "max-h-[calc(100vh-var(--size-modal-viewport-inset))] overflow-hidden [&_[data-modal-body]]:max-h-[calc(100vh-var(--size-modal-body-offset))] [&_[data-modal-body]]:overflow-y-auto",
          MODAL_CONTENT_SIZE_CLASS[resolvedSize],
          MODAL_CONTENT_INTENT_CLASS[resolvedIntent],
          className
        )}
        {...props}
      >
        {children}
        {!hideCloseButton ? (
          <DialogPrimitive.Close
            aria-label={closeAriaLabel}
            className="text-muted focus:ring-primary absolute right-[var(--space-4)] top-[var(--space-4)] rounded-[var(--radius-sm)] opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2"
          >
            <X className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  }
);
ModalContent.displayName = DialogPrimitive.Content.displayName;

export function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-[var(--space-4)] flex flex-col space-y-[var(--space-1-5)]", className)} {...props} />;
}

export function ModalFooter({
  className,
  children,
  cancelText = MODAL_FOOTER_DEFAULTS.cancelText,
  confirmText = MODAL_FOOTER_DEFAULTS.confirmText,
  cancelVariant = MODAL_FOOTER_DEFAULTS.cancelVariant,
  confirmVariant = MODAL_FOOTER_DEFAULTS.confirmVariant,
  cancelDisabled = MODAL_FOOTER_DEFAULTS.cancelDisabled,
  confirmDisabled = MODAL_FOOTER_DEFAULTS.confirmDisabled,
  confirmLoading = MODAL_FOOTER_DEFAULTS.confirmLoading,
  closeOnConfirm = MODAL_FOOTER_DEFAULTS.closeOnConfirm,
  autoFocusButton = MODAL_FOOTER_DEFAULTS.autoFocusButton,
  align = MODAL_FOOTER_DEFAULTS.align,
  sticky = MODAL_FOOTER_DEFAULTS.sticky,
  showCancelButton = MODAL_FOOTER_DEFAULTS.showCancelButton,
  showConfirmButton = MODAL_FOOTER_DEFAULTS.showConfirmButton,
  fullWidthActions = MODAL_FOOTER_DEFAULTS.fullWidthActions,
  onCancel,
  onConfirm,
  ...props
}: ModalFooterProps) {
  const withBuiltInActions = useBuiltInModalActions(onCancel, onConfirm);
  const resolvedAlign = resolveOption(align, { start: true, center: true, end: true, between: true }, MODAL_FOOTER_DEFAULTS.align);
  const footerAlignClass = React.useMemo(
    () =>
      resolvedAlign === "start"
        ? "sm:justify-start"
        : resolvedAlign === "center"
          ? "sm:justify-center"
          : resolvedAlign === "between"
            ? "sm:justify-between"
            : "sm:justify-end",
    [resolvedAlign]
  );
  const actionWidthClass = React.useMemo(() => (fullWidthActions ? "w-full sm:w-auto" : ""), [fullWidthActions]);

  return (
    <div
      className={cn(
        "mt-[var(--space-6)] flex flex-col-reverse gap-[var(--space-2)] sm:flex-row",
        footerAlignClass,
        sticky &&
          "bg-surface border-default sticky bottom-0 -mx-[var(--space-6)] -mb-[var(--space-6)] border-t px-[var(--space-6)] py-[var(--space-4)]",
        className
      )}
      {...props}
    >
      {withBuiltInActions ? (
        <>
          {showCancelButton && onCancel ? (
            <Button
              className={actionWidthClass}
              variant={cancelVariant}
              disabled={cancelDisabled}
              autoFocus={autoFocusButton === "cancel"}
              onClick={onCancel}
            >
              {cancelText}
            </Button>
          ) : null}
          {showConfirmButton && onConfirm ? (
            closeOnConfirm ? (
              <DialogPrimitive.Close asChild>
                <Button
                  className={actionWidthClass}
                  variant={confirmVariant}
                  disabled={confirmDisabled}
                  loading={confirmLoading ? true : undefined}
                  autoFocus={autoFocusButton === "confirm"}
                  onClick={onConfirm}
                >
                  {confirmText}
                </Button>
              </DialogPrimitive.Close>
            ) : (
              <Button
                className={actionWidthClass}
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

export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-title", className)} {...props} />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-body-sm text-muted", className)} {...props} />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

export const ModalBody = React.memo(function ModalBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-modal-body className={cn("space-y-[var(--space-4)]", className)} {...props} />;
});
ModalBody.displayName = "ModalBody";
