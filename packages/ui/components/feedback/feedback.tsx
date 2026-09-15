"use client";

import * as React from "react";
import { CheckCircle2, CircleAlert, CircleX, Info, Inbox, TriangleAlert } from "lucide-react";
import { cn } from "../cn";
import type { AlertProps, EmptyProps, ResultProps } from "./feedback.types";
import type { ToastInput } from "../toast";
import { toast } from "../toast";

const alertConfig = {
  success: { Icon: CheckCircle2, box: "border-success/30 bg-success/10 text-success" },
  info: { Icon: Info, box: "border-info/30 bg-info/10 text-info" },
  warning: { Icon: TriangleAlert, box: "border-warning/30 bg-warning/10 text-warning" },
  error: { Icon: CircleX, box: "border-danger/30 bg-danger/10 text-danger" }
} as const;

export function Alert({
  type = "info",
  message,
  description,
  showIcon = true,
  closable = false,
  closeText = "×",
  onClose,
  action,
  className,
  ...props
}: AlertProps) {
  const [visible, setVisible] = React.useState(true);
  const { Icon, box } = alertConfig[type];
  if (!visible) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn("flex gap-3 rounded-[var(--radius-md)] border px-4 py-3", box, className)}
      {...props}
    >
      {showIcon ? <Icon className="mt-0.5 size-5 shrink-0" aria-hidden /> : null}
      <div className="min-w-0 flex-1">
        <p className="break-words font-medium">{message}</p>
        {description ? <p className="mt-1 break-words text-sm opacity-80">{description}</p> : null}
      </div>
      {action}
      {closable ? (
        <button
          type="button"
          aria-label="Close alert"
          className="focus-visible:ring-primary shrink-0 rounded-sm text-current opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2"
          onClick={(event) => {
            setVisible(false);
            onClose?.(event);
          }}
        >
          {closeText}
        </button>
      ) : null}
    </div>
  );
}

export function Empty({ image, description = "No data", children, className, ...props }: EmptyProps) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-8 text-center",
        className
      )}
      {...props}
    >
      <div className="text-text-tertiary">{image ?? <Inbox className="size-10" aria-hidden />}</div>
      <p className="text-text-secondary text-sm">{description}</p>
      {children}
    </div>
  );
}

const resultIcons = {
  success: CheckCircle2,
  error: CircleX,
  info: Info,
  warning: CircleAlert,
  "404": Inbox,
  "403": CircleX,
  "500": CircleX
} as const;
export function Result({ status = "info", title, subTitle, icon, extra, className, ...props }: ResultProps) {
  const Icon = resultIcons[status];
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-4 py-12 text-center", className)}
      {...props}
    >
      <div
        className={cn(
          "mb-5 rounded-full p-3",
          status === "success"
            ? "bg-success/10 text-success"
            : status === "error" || status === "403" || status === "500"
              ? "bg-danger/10 text-danger"
              : status === "warning"
                ? "bg-warning/10 text-warning"
                : "bg-info/10 text-info"
        )}
      >
        {icon ?? <Icon className="size-10" aria-hidden />}
      </div>
      <h2 className="text-text-primary text-xl font-semibold">{title}</h2>
      {subTitle ? <p className="text-text-secondary mt-2 max-w-lg text-sm">{subTitle}</p> : null}
      {extra ? <div className="mt-6 flex flex-wrap justify-center gap-2">{extra}</div> : null}
    </div>
  );
}

type NoticeOptions = { message: ToastInput; description?: React.ReactNode; duration?: number };
const noticeInput = ({ message: input, description, duration }: NoticeOptions): ToastInput => {
  if (!description && duration === undefined) return input;
  const message = typeof input === "string" ? input : input.message;
  return {
    ...(typeof input === "string" ? {} : input),
    message: description ? `${message} — ${String(description)}` : message,
    ...(duration === undefined ? {} : { durationMs: duration })
  };
};
export const message = Object.assign((input: ToastInput) => toast(input), {
  success: (input: ToastInput, duration?: number) => toast.success(input, duration),
  error: (input: ToastInput, duration?: number) => toast.error(input, duration),
  info: (input: ToastInput, duration?: number) => toast.info(input, duration),
  warning: (input: ToastInput, duration?: number) => toast.warning(input, duration)
});
export const notification = {
  open: (options: NoticeOptions) => toast.info(noticeInput(options)),
  success: (options: NoticeOptions) => toast.success(noticeInput(options)),
  error: (options: NoticeOptions) => toast.error(noticeInput(options)),
  info: (options: NoticeOptions) => toast.info(noticeInput(options)),
  warning: (options: NoticeOptions) => toast.warning(noticeInput(options))
};
