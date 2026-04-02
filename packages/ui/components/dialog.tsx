"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "./cn";
import { Button, type ButtonProps } from "./button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="bg-foreground/35 fixed inset-0 z-50 backdrop-blur-[1px]" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "border-default bg-surface fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="focus:ring-primary absolute right-4 top-4 rounded-sm opacity-80 hover:opacity-100 focus:outline-none focus:ring-2">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col space-y-1.5", className)} {...props} />;
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  cancelText?: string;
  confirmText?: string;
  cancelVariant?: ButtonProps["variant"];
  confirmVariant?: ButtonProps["variant"];
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
}

export function DialogFooter({
  className,
  children,
  cancelText = "취소",
  confirmText = "삭제",
  cancelVariant = "outline",
  confirmVariant = "danger",
  cancelDisabled = false,
  confirmDisabled = false,
  confirmLoading = false,
  onCancel,
  onConfirm,
  ...props
}: DialogFooterProps) {
  const useBuiltInActions = Boolean(onCancel || onConfirm);

  return (
    <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props}>
      {useBuiltInActions ? (
        <>
          {onCancel ? (
            <Button variant={cancelVariant} disabled={cancelDisabled} onClick={onCancel}>
              {cancelText}
            </Button>
          ) : null}
          {onConfirm ? (
            <Button
              variant={confirmVariant}
              disabled={confirmDisabled}
              loading={confirmLoading ? true : undefined}
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          ) : null}
        </>
      ) : (
        children
      )}
    </div>
  );
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-muted text-sm", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
