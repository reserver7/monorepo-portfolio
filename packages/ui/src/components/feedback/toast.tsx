"use client";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { ReactNode } from "react";
import { ToastVariant, useToastState } from "../../hooks/use-toast";
import { cn } from "../../lib/utils";
const toastVariants = cva(
  "group pointer-events-auto relative w-full overflow-hidden rounded-xl border p-3 shadow-lg transition-all data-[state=open]:animate-in data-[state=open]:fade-in-80 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-top-2",
  {
    variants: {
      variant: {
        info: "border-sky-300/90 bg-sky-50 text-sky-950 shadow-sky-200/60 dark:border-sky-500/70 dark:bg-sky-950 dark:text-sky-100 dark:shadow-sky-950/70",
        success:
          "border-emerald-300/90 bg-emerald-50 text-emerald-950 shadow-emerald-200/60 dark:border-emerald-500/70 dark:bg-emerald-950 dark:text-emerald-100 dark:shadow-emerald-950/70",
        warning:
          "border-amber-300/90 bg-amber-50 text-amber-950 shadow-amber-200/60 dark:border-amber-500/70 dark:bg-amber-950 dark:text-amber-100 dark:shadow-amber-950/70",
        error:
          "border-rose-300/90 bg-rose-50 text-rose-950 shadow-rose-200/60 dark:border-rose-500/70 dark:bg-rose-950 dark:text-rose-100 dark:shadow-rose-950/70"
      }
    },
    defaultVariants: { variant: "info" }
  }
);
const toastIconVariants = cva("h-5 w-5 shrink-0 stroke-2", {
  variants: {
    variant: {
      info: "text-sky-700 dark:text-sky-200",
      success: "text-emerald-700 dark:text-emerald-200",
      warning: "text-amber-700 dark:text-amber-200",
      error: "text-rose-700 dark:text-rose-200"
    }
  },
  defaultVariants: { variant: "info" }
});
const toastCloseVariants = cva(
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border p-0 text-[11px] font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2",
  {
    variants: {
      variant: {
        info: "border-sky-300/80 text-sky-800 hover:bg-sky-100 focus-visible:ring-sky-400 dark:border-sky-600/70 dark:text-sky-100 dark:hover:bg-sky-900/70 dark:focus-visible:ring-sky-500",
        success:
          "border-emerald-300/80 text-emerald-800 hover:bg-emerald-100 focus-visible:ring-emerald-400 dark:border-emerald-600/70 dark:text-emerald-100 dark:hover:bg-emerald-900/70 dark:focus-visible:ring-emerald-500",
        warning:
          "border-amber-300/80 text-amber-800 hover:bg-amber-100 focus-visible:ring-amber-400 dark:border-amber-600/70 dark:text-amber-100 dark:hover:bg-amber-900/70 dark:focus-visible:ring-amber-500",
        error:
          "border-rose-300/80 text-rose-800 hover:bg-rose-100 focus-visible:ring-rose-400 dark:border-rose-600/70 dark:text-rose-100 dark:hover:bg-rose-900/70 dark:focus-visible:ring-rose-500"
      }
    },
    defaultVariants: { variant: "info" }
  }
);
const ToastIcon = ({ variant }: { variant: ToastVariant }) => {
  const iconClassName = cn(toastIconVariants({ variant }));
  if (variant === "success") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconClassName}
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" /> <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }
  if (variant === "warning") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconClassName}
        aria-hidden
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
        <path d="M12 9v4" /> <path d="M12 17h.01" />
      </svg>
    );
  }
  if (variant === "error") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconClassName}
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" /> <path d="m15 9-6 6" /> <path d="m9 9 6 6" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClassName}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" /> <path d="M12 16v-4" /> <path d="M12 8h.01" />
    </svg>
  );
};
export const ToastProvider = ({ children }: { children?: ReactNode }) => {
  const { items, dismiss } = useToastState();
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}
      {items.map((item) => {
        const hasDescription = Boolean(item.description?.trim());
        return (
          <ToastPrimitive.Root
            key={item.id}
            defaultOpen
            duration={item.durationMs}
            className={cn(
              toastVariants({ variant: item.variant }),
              hasDescription ? "flex items-start gap-3" : "flex items-center gap-3"
            )}
            onOpenChange={(open) => {
              if (!open) {
                dismiss(item.id);
              }
            }}
          >
            <div className={cn("shrink-0", hasDescription ? "pt-0.5" : "")}>
              <ToastIcon variant={item.variant} />
            </div>
            <div className="min-w-0 flex-1">
              <ToastPrimitive.Title className="line-clamp-1 text-sm font-semibold leading-6">
                {item.title}
              </ToastPrimitive.Title>
              {hasDescription ? (
                <ToastPrimitive.Description className="mt-0.5 line-clamp-3 text-xs leading-5 opacity-95">
                  {item.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close
              type="button"
              className={cn(
                toastCloseVariants({ variant: item.variant }),
                hasDescription ? "self-start" : "self-center"
              )}
              aria-label="토스트 닫기"
              title="닫기"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 stroke-2"
                aria-hidden
              >
                <path d="M18 6 6 18" /> <path d="m6 6 12 12" />
              </svg>
              <span className="sr-only">닫기</span>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed left-1/2 top-4 z-[90] flex w-[min(94vw,420px)] -translate-x-1/2 flex-col gap-2 outline-none sm:top-6" />
    </ToastPrimitive.Provider>
  );
};
export const Toaster = ToastProvider;
