"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../cn";
import { SHEET_DEFAULTS } from "./sheet.constants";
import { getSheetContentClassName } from "./sheet.utils";
import type { SheetContentProps } from "./sheet.types";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/55 backdrop-blur-[10px] backdrop-saturate-150 transition-opacity duration-200 data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, SheetContentProps>(
  (
    {
      side = SHEET_DEFAULTS.side,
      size = SHEET_DEFAULTS.size,
      scrollBehavior = SHEET_DEFAULTS.scrollBehavior,
      showOverlay = SHEET_DEFAULTS.showOverlay,
      showCloseButton = SHEET_DEFAULTS.showCloseButton,
      closeAriaLabel = SHEET_DEFAULTS.closeAriaLabel,
      closeOnEscape = SHEET_DEFAULTS.closeOnEscape,
      closeOnOutsideClick = SHEET_DEFAULTS.closeOnOutsideClick,
      overlayClassName,
      className,
      children,
      onEscapeKeyDown,
      onPointerDownOutside,
      ...props
    },
    ref
  ) => {
    const contentClassName = React.useMemo(
      () => cn(getSheetContentClassName({ side, size, scrollBehavior }), className),
      [className, scrollBehavior, side, size]
    );

    return (
      <SheetPortal>
        {showOverlay ? <SheetOverlay className={overlayClassName} /> : null}
        <DialogPrimitive.Content
          ref={ref}
          onEscapeKeyDown={(event) => {
            if (!closeOnEscape) {
              event.preventDefault();
            }
            onEscapeKeyDown?.(event);
          }}
          onPointerDownOutside={(event) => {
            if (!closeOnOutsideClick) {
              event.preventDefault();
            }
            onPointerDownOutside?.(event);
          }}
          className={contentClassName}
          {...props}
        >
          {children}
          {showCloseButton ? (
            <DialogPrimitive.Close
              aria-label={closeAriaLabel}
              className="text-muted focus-visible:ring-primary absolute right-4 top-4 rounded-[var(--radius-sm)] opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2"
            >
              <X className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      </SheetPortal>
    );
  }
);
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader = React.memo(({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 flex flex-col space-y-1.5", className)} {...props} />
));
SheetHeader.displayName = "SheetHeader";

const SheetFooter = React.memo(({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "border-border-subtle bg-surface mt-auto flex shrink-0 flex-col-reverse gap-2 border-t pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
));
SheetFooter.displayName = "SheetFooter";

const SheetBody = React.memo(({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-sheet-body
    className={cn("min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain", className)}
    {...props}
  />
));
SheetBody.displayName = "SheetBody";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-title text-foreground", className)} {...props} />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-body-sm text-muted", className)} {...props} />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription
};
