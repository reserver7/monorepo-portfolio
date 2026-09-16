"use client";

import * as React from "react";
import { cn } from "../cn";
import { useUiLocale } from "../ui-locale";

export type FieldStatus = "default" | "error" | "success";

export const resolveFieldStatus = (status?: FieldStatus, hasErrorMessage?: boolean): FieldStatus => {
  if (status) return status;
  return hasErrorMessage ? "error" : "default";
};

export const buildFieldDescribedBy = (...ids: Array<string | undefined | false>) => {
  const tokens = ids.filter(Boolean) as string[];
  return tokens.length > 0 ? tokens.join(" ") : undefined;
};

export const RequiredMark = React.memo(function RequiredMark({
  align = "end",
  className
}: {
  align?: "start" | "end";
  className?: string;
}) {
  const labels = useUiLocale();
  return (
    <div className={cn("flex", align === "start" ? "justify-start" : "justify-end", className)}>
      <span aria-hidden className="text-danger">
        *
      </span>
      <span className="sr-only">{labels.required}</span>
    </div>
  );
});
RequiredMark.displayName = "RequiredMark";

export const FieldSupportText = React.memo(function FieldSupportText({
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
});
FieldSupportText.displayName = "FieldSupportText";
