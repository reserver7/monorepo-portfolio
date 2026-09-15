"use client";

import * as React from "react";
import { Button } from "../button";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Sheet, SheetBody, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "../sheet";
import { cn } from "../cn";
import type { DrawerProps, FloatButtonProps, PopconfirmProps, TourProps } from "./overlay.types";

export function Drawer({
  open = false,
  onClose,
  title,
  footer,
  placement = "right",
  width,
  height,
  closable = true,
  mask = true,
  children,
  className,
  ...props
}: DrawerProps) {
  const size = width || height ? undefined : "md";
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <SheetContent
        side={placement}
        size={size}
        showOverlay={mask}
        showCloseButton={closable}
        className={className}
        style={{
          ...(width && (placement === "left" || placement === "right") ? { width } : {}),
          ...(height && (placement === "top" || placement === "bottom") ? { height } : {})
        }}
        {...props}
      >
        {title ? (
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        ) : null}
        <SheetBody>{children}</SheetBody>
        {footer ? <SheetFooter>{footer}</SheetFooter> : null}
        {closable ? null : <SheetClose className="sr-only">Close</SheetClose>}
      </SheetContent>
    </Sheet>
  );
}

export function Popconfirm({
  title,
  description,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  onConfirm,
  onCancel,
  okText = "OK",
  cancelText = "Cancel",
  okType = "primary",
  showCancel = true,
  disabled = false,
  loading = false,
  className
}: PopconfirmProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const confirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    await onConfirm?.(event);
    setOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={8}
        className={cn("w-[min(18rem,calc(100vw-2rem))] space-y-3", className)}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="space-y-1">
          <p id={titleId} className="text-text-primary break-words font-medium">
            {title}
          </p>
          {description ? (
            <p id={descriptionId} className="text-text-secondary break-words text-sm">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {showCancel ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={(event) => {
                onCancel?.(event);
                setOpen(false);
              }}
            >
              {cancelText}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant={okType === "danger" ? "danger" : okType === "default" ? "outline" : "primary"}
            loading={loading}
            onClick={confirm}
          >
            {okText}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const targetElement = (target: TourProps["steps"][number]["target"]) => {
  if (!target) return null;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  if (typeof target === "function") return target();
  return target;
};

export function Tour({
  steps,
  open,
  defaultOpen = false,
  current,
  defaultCurrent = 0,
  onChange,
  onClose,
  nextText = "Next",
  prevText = "Back",
  finishText = "Finish",
  mask = true,
  closable = true,
  className
}: TourProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const [internalCurrent, setInternalCurrent] = React.useState(defaultCurrent);
  const isOpen = open ?? internalOpen;
  const stepIndex = current ?? internalCurrent;
  const step = steps[stepIndex];
  React.useEffect(() => {
    if (isOpen && step) targetElement(step.target)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [isOpen, step]);
  React.useEffect(() => {
    if (!isOpen || !closable) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closable, isOpen]);
  if (!isOpen || !step) return null;
  const close = () => {
    if (open === undefined) setInternalOpen(false);
    onClose?.();
  };
  const change = (next: number) => {
    if (current === undefined) setInternalCurrent(next);
    onChange?.(next);
  };
  const last = stepIndex >= steps.length - 1;
  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Product tour">
      {mask ? <div className="absolute inset-0 bg-black/45" onClick={closable ? close : undefined} /> : null}
      <div
        className={cn(
          "border-border-subtle bg-surface-elevated shadow-card absolute left-1/2 top-1/2 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border p-5",
          step.placement === "top" && "-translate-y-[calc(100%+1rem)]",
          step.placement === "bottom" && "translate-y-4",
          step.placement === "left" && "-translate-x-[calc(100%+1rem)]",
          step.placement === "right" && "translate-x-4",
          className
        )}
      >
        {closable ? (
          <button
            type="button"
            aria-label="Close tour"
            className="text-text-tertiary focus-visible:ring-primary absolute right-3 top-3 rounded-sm focus-visible:outline-none focus-visible:ring-2"
            onClick={close}
          >
            ×
          </button>
        ) : null}
        <div className="space-y-2 pr-6">
          <h3 className="text-text-primary font-semibold">{step.title}</h3>
          {step.description ? <p className="text-text-secondary text-sm">{step.description}</p> : null}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-text-tertiary text-xs">
            {stepIndex + 1} / {steps.length}
          </span>
          <div className="flex gap-2">
            {stepIndex > 0 ? (
              <Button size="sm" variant="ghost" onClick={() => change(stepIndex - 1)}>
                {prevText}
              </Button>
            ) : null}
            <Button size="sm" onClick={() => (last ? close() : change(stepIndex + 1))}>
              {last ? finishText : nextText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const positions: Record<NonNullable<FloatButtonProps["position"]>, string> = {
  "bottom-right": "bottom-6 right-6",
  "bottom-left": "bottom-6 left-6",
  "top-right": "top-6 right-6",
  "top-left": "top-6 left-6"
};

export const FloatButton = React.forwardRef<HTMLButtonElement, FloatButtonProps>(function FloatButton(
  { icon = "↑", description, badge, position = "bottom-right", shape = "circle", className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={props["aria-label"] ?? (description ? undefined : "Floating action")}
      className={cn(
        "border-border-subtle bg-surface-elevated text-text-primary shadow-card focus-visible:ring-action fixed z-40 inline-flex min-h-12 min-w-12 items-center justify-center gap-2 border px-3 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2",
        shape === "circle" ? "rounded-full" : "rounded-[var(--radius-md)]",
        positions[position],
        className
      )}
      {...props}
    >
      <span aria-hidden={!description}>{icon}</span>
      {description ? <span className="text-sm">{description}</span> : null}
      {badge ? (
        <span className="bg-danger absolute -right-1 -top-1 rounded-full px-1.5 text-xs text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
});
