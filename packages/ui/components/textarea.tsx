"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import type { RegisterOptions } from "react-hook-form";
import { cn } from "./cn";

type TextareaSize = "sm" | "md" | "lg";
type TextareaVariant = "default" | "filled" | "ghost";
type TextareaState = "default" | "error" | "success";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: TextareaSize;
  variant?: TextareaVariant;
  state?: TextareaState;
  control?: unknown;
  rules?: RegisterOptions;
}

const TextareaBase = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size = "md", variant = "default", state = "default", ...props }, ref) => {
    const bySize: Record<TextareaSize, string> = {
      sm: "min-h-[84px] text-body-sm",
      md: "min-h-[110px] text-body-md",
      lg: "min-h-[140px] text-body-md"
    };
    const byVariant: Record<TextareaVariant, string> = {
      default: "border-default bg-surface",
      filled: "border-transparent bg-surface-elevated",
      ghost: "border-transparent bg-transparent"
    };
    const byState: Record<TextareaState, string> = {
      default: "focus:border-primary focus:ring-primary/20",
      error: "border-danger/40 focus:border-danger focus:ring-danger/20",
      success: "border-success/40 focus:border-success focus:ring-success/20"
    };

    return (
      <textarea
        ref={ref}
        className={cn(
          "text-foreground placeholder:text-muted w-full rounded-md border px-3 py-2 outline-none ring-0 transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
          bySize[size],
          byVariant[variant],
          byState[state],
          className
        )}
        {...props}
      />
    );
  }
);
TextareaBase.displayName = "TextareaBase";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const { control, rules, name, onChange, onBlur, ...rest } = props;

  if (control && typeof name === "string" && name.length > 0) {
    return (
      <Controller
        control={control as any}
        name={name as any}
        rules={rules}
        render={({ field }) => (
          <TextareaBase
            {...rest}
            ref={ref}
            name={field.name}
            value={field.value == null ? "" : String(field.value)}
            onChange={(event) => {
              field.onChange(event.target.value);
              onChange?.(event);
            }}
            onBlur={(event) => {
              field.onBlur();
              onBlur?.(event);
            }}
          />
        )}
      />
    );
  }

  return <TextareaBase {...rest} ref={ref} name={name} onChange={onChange} onBlur={onBlur} />;
});
Textarea.displayName = "Textarea";
