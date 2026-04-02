"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "./cn";
import { Button, buttonVariants, type ButtonProps } from "./button";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[1px]" />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-default bg-surface p-6 shadow-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPrimitive.Portal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col space-y-1.5", className)} {...props} />;
}

export interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
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

export function AlertDialogFooter({
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
}: AlertDialogFooterProps) {
  const useBuiltInActions = Boolean(onCancel || onConfirm);

  return (
    <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props}>
      {useBuiltInActions ? (
        <>
          {onCancel ? (
            <AlertDialogCancel asChild>
              <Button variant={cancelVariant} disabled={cancelDisabled} onClick={onCancel}>
                {cancelText}
              </Button>
            </AlertDialogCancel>
          ) : null}
          {onConfirm ? (
            <AlertDialogAction asChild>
              <Button
                variant={confirmVariant}
                disabled={confirmDisabled}
                loading={confirmLoading ? true : undefined}
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </AlertDialogAction>
          ) : null}
        </>
      ) : (
        children
      )}
    </div>
  );
}

export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={cn("text-sm text-muted", className)} {...props} />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

export function AlertDialogAction({ className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>) {
  return <AlertDialogPrimitive.Action className={buttonVariants({ variant: "danger", className })} {...props} />;
}

export function AlertDialogCancel({ className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel className={buttonVariants({ variant: "outline", className })} {...props} />;
}
