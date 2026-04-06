"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { cn } from "../cn";
import { buildFieldDescribedBy, FieldSupportText, RequiredMark } from "../field/field-utils";
import { Label } from "../label";
import {
  TEXTAREA_DEFAULTS,
  TEXTAREA_RESIZE_CLASS,
  TEXTAREA_SIZE_CLASS,
  TEXTAREA_STATUS_CLASS,
  TEXTAREA_VARIANT_CLASS
} from "./textarea.constants";
import { resolveTextareaStatus } from "./textarea.hooks";
import type { TextareaProps } from "./textarea.types";

const TextareaBase = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      helperClassName,
      size = TEXTAREA_DEFAULTS.size,
      variant = TEXTAREA_DEFAULTS.variant,
      status,
      state,
      resize = TEXTAREA_DEFAULTS.resize,
      label,
      helperText,
      errorMessage,
      required,
      showCount = TEXTAREA_DEFAULTS.showCount,
      countFormatter,
      maxLength,
      rows = TEXTAREA_DEFAULTS.rows,
      id,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const resolvedId = id ?? (label ? `textarea-${generatedId}` : undefined);
    const activeStatus = resolveTextareaStatus(status, state, Boolean(errorMessage));
    const supportMessage = errorMessage ?? helperText;
    const [innerValue, setInnerValue] = React.useState(defaultValue != null ? String(defaultValue) : "");
    const isControlled = value !== undefined;
    const currentValue = isControlled ? String(value ?? "") : innerValue;
    const currentLength = currentValue.length;
    const shouldShowCount = showCount;
    const countText = countFormatter
      ? countFormatter(currentLength, maxLength)
      : typeof maxLength === "number"
        ? `${currentLength}/${maxLength}`
        : String(currentLength);
    const supportTextId = resolvedId ? `${resolvedId}-support` : undefined;
    const countTextId = resolvedId ? `${resolvedId}-count` : undefined;
    const describedByIds = buildFieldDescribedBy(
      supportMessage ? supportTextId : undefined,
      shouldShowCount ? countTextId : undefined
    );

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!isControlled) {
          setInnerValue(event.target.value);
        }
        onChange?.(event);
      },
      [isControlled, onChange]
    );

    return (
      <div className={cn("grid gap-1.5", containerClassName)}>
        {label ? (
          <Label
            htmlFor={resolvedId}
            size={size === "lg" ? "md" : "sm"}
            className={cn("inline-flex items-center gap-1", labelClassName)}
          >
            <span>{label}</span>
            {required ? <span className="text-danger">*</span> : null}
          </Label>
        ) : required ? (
          <RequiredMark />
        ) : null}

        <textarea
          ref={ref}
          id={resolvedId}
          required={required}
          value={isControlled ? currentValue : undefined}
          defaultValue={isControlled ? undefined : defaultValue}
          onChange={handleChange}
          rows={rows}
          maxLength={maxLength}
          aria-invalid={activeStatus === "error" ? true : undefined}
          aria-describedby={describedByIds}
          className={cn(
            "text-foreground placeholder:text-muted w-full rounded-md border px-3 py-2 outline-none ring-0 transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
            TEXTAREA_SIZE_CLASS[size],
            TEXTAREA_VARIANT_CLASS[variant],
            TEXTAREA_STATUS_CLASS[activeStatus],
            TEXTAREA_RESIZE_CLASS[resize],
            className
          )}
          {...props}
        />

        <FieldSupportText
          id={supportTextId}
          message={supportMessage}
          error={Boolean(errorMessage)}
          className={helperClassName}
        />
        {shouldShowCount ? (
          <p id={countTextId} className="text-caption text-muted justify-self-end">
            {countText}
          </p>
        ) : null}
      </div>
    );
  }
);
TextareaBase.displayName = "TextareaBase";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const { control, rules, name, onChange, onBlur, required, ...rest } = props;
  const mergedRules = React.useMemo(() => {
    if (!required || rules?.required) return rules;
    return { required: "필수 입력 항목입니다.", ...rules };
  }, [required, rules]);

  if (control && typeof name === "string" && name.length > 0) {
    return (
      <Controller
        control={control as any}
        name={name as any}
        rules={mergedRules}
        render={({ field }) => (
          <TextareaBase
            {...rest}
            ref={ref}
            name={field.name}
            required={required}
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

  return <TextareaBase {...rest} ref={ref} name={name} required={required} onChange={onChange} onBlur={onBlur} />;
});
Textarea.displayName = "Textarea";
