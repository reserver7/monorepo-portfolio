"use client";

import * as React from "react";
import { cn } from "../cn";

export type FieldStatus = "default" | "error" | "success";

export const resolveFieldStatus = (
  status?: FieldStatus,
  state?: FieldStatus,
  hasErrorMessage?: boolean
): FieldStatus => {
  if (status) return status;
  if (state) return state;
  return hasErrorMessage ? "error" : "default";
};

export const buildFieldDescribedBy = (...ids: Array<string | undefined | false>) => {
  const tokens = ids.filter(Boolean) as string[];
  return tokens.length > 0 ? tokens.join(" ") : undefined;
};

export function RequiredMark({
  align = "end",
  className
}: {
  align?: "start" | "end";
  className?: string;
}) {
  return (
    <div className={cn("flex", align === "start" ? "justify-start" : "justify-end", className)}>
      <span aria-hidden className="text-danger">
        *
      </span>
      <span className="sr-only">필수 입력 항목</span>
    </div>
  );
}

export function FieldSupportText({
  id,
  message,
  error,
  className
}: {
  id?: string;
  message?: React.ReactNode;
  error?: boolean;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p id={id} className={cn("text-caption", error ? "text-danger" : "text-muted", className)}>
      {message}
    </p>
  );
}
