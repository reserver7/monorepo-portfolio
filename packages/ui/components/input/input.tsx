"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { X } from "lucide-react";
import { useComposedRefs, useControlledValue } from "../../hooks";
import { cn } from "../cn";
import { buildFieldDescribedBy, FieldSupportText, RequiredMark } from "../field/field-utils";
import { Label } from "../label";
import {
  clearInputValue,
  INPUT_DECORATED_STATUS_CLASS,
  INPUT_DEFAULTS,
  INPUT_SIZE_CLASS,
  INPUT_STATUS_CLASS,
  INPUT_VARIANT_CLASS
} from "./input.constants";
import { resolveInputStatus } from "./input.hooks";
import type { InputProps } from "./input.types";

const InputBase = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      helperClassName,
      showCount = false,
      countFormatter,
      size = INPUT_DEFAULTS.size,
      variant = INPUT_DEFAULTS.variant,
      status,
      state,
      label,
      helperText,
      errorMessage,
      required,
      disabled,
      readOnly,
      prefix,
      suffix,
      clearable = INPUT_DEFAULTS.clearable,
      onClear,
      id,
      type = "text",
      value,
      defaultValue,
      maxLength,
      onChange,
      onBlur,
      name,
      ...props
    },
    ref
  ) => {
    const localRef = React.useRef<HTMLInputElement | null>(null);
    const setRefs = useComposedRefs<HTMLInputElement>(ref, localRef);
    const generatedId = React.useId();
    const resolvedId = id ?? (label ? `input-${generatedId}` : undefined);

    const [currentValue, setCurrentValue, isControlled] = useControlledValue<string>({
      value: value != null ? String(value) : undefined,
      defaultValue: defaultValue != null ? String(defaultValue) : ""
    });
    const controlledValue = isControlled ? currentValue : undefined;
    const uncontrolledDefaultValue = isControlled
      ? undefined
      : defaultValue != null
        ? String(defaultValue)
        : undefined;

    const activeStatus = resolveInputStatus(status, state, Boolean(errorMessage));
    const supportMessage = errorMessage ?? helperText;
    const hasDecorator = Boolean(prefix || suffix || clearable);
    const shouldWrapField = Boolean(
      label || required || supportMessage || hasDecorator || containerClassName || labelClassName || helperClassName
    );
    const showClearButton = clearable && currentValue.length > 0 && !disabled && !readOnly;
    const currentLength = currentValue.length;
    const shouldShowCount = showCount;
    const countText = countFormatter
      ? countFormatter(currentLength, maxLength)
      : typeof maxLength === "number"
        ? `${currentLength}/${maxLength}`
        : String(currentLength);
    const supportTextId = resolvedId ? `${resolvedId}-support` : undefined;
    const countTextId = resolvedId ? `${resolvedId}-count` : undefined;
    const ariaDescribedBy = buildFieldDescribedBy(
      supportMessage ? supportTextId : undefined,
      shouldShowCount ? countTextId : undefined
    );

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) {
          setCurrentValue(event.target.value);
        }
        onChange?.(event);
      },
      [isControlled, onChange, setCurrentValue]
    );

    const handleClear = React.useCallback(() => {
      const element = localRef.current;
      if (!element || disabled || readOnly) {
        return;
      }

      clearInputValue(element);
      if (!isControlled) {
        setCurrentValue("");
      }
      onClear?.();
      element.focus();
    }, [disabled, isControlled, onClear, readOnly, setCurrentValue]);

    const inputElement = (
      <input
        ref={setRefs}
        id={resolvedId}
        type={type}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        value={controlledValue}
        defaultValue={uncontrolledDefaultValue}
        onChange={handleChange}
        onBlur={onBlur}
        name={name}
        maxLength={maxLength}
        aria-invalid={activeStatus === "error" ? true : undefined}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "text-foreground placeholder:text-muted w-full outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          hasDecorator
            ? "h-auto min-w-0 flex-1 border-0 bg-transparent p-0 focus:ring-0"
            : "rounded-md border px-3 py-2 ring-0 focus:ring-2",
          !hasDecorator && INPUT_SIZE_CLASS[size],
          !hasDecorator && INPUT_VARIANT_CLASS[variant],
          !hasDecorator && INPUT_STATUS_CLASS[activeStatus],
          className
        )}
        {...props}
      />
    );

    if (!shouldWrapField) {
      return inputElement;
    }

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

        {hasDecorator ? (
          <div
            className={cn(
              "flex w-full items-center gap-2 rounded-md border px-3 transition-colors focus-within:ring-2",
              INPUT_SIZE_CLASS[size],
              INPUT_VARIANT_CLASS[variant],
              INPUT_DECORATED_STATUS_CLASS[activeStatus],
              disabled ? "cursor-not-allowed opacity-50" : null
            )}
          >
            {prefix ? <span className="text-muted flex shrink-0 items-center">{prefix}</span> : null}
            {inputElement}
            {showClearButton ? (
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={handleClear}
                tabIndex={-1}
                aria-label="입력값 비우기"
                className="text-muted hover:bg-surface-elevated hover:text-foreground inline-flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {suffix ? <span className="text-muted flex shrink-0 items-center">{suffix}</span> : null}
          </div>
        ) : (
          inputElement
        )}

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
InputBase.displayName = "InputBase";

export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { control, rules, name, onChange, onBlur, ...rest } = props;

  if (control && typeof name === "string" && name.length > 0) {
    return (
      <Controller
        control={control as any}
        name={name as any}
        rules={rules}
        render={({ field }) => (
          <InputBase
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

  return <InputBase {...rest} ref={ref} name={name} onChange={onChange} onBlur={onBlur} />;
});
Input.displayName = "Input";
