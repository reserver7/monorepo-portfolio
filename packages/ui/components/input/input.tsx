"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { useComposedRefs, useControlledValue } from "../../hooks";
import { cn } from "../cn";
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
    const uncontrolledDefaultValue = isControlled ? undefined : (defaultValue != null ? String(defaultValue) : undefined);

    const activeStatus = resolveInputStatus(status, state, Boolean(errorMessage));
    const supportMessage = errorMessage ?? helperText;
    const hasDecorator = Boolean(prefix || suffix || clearable);
    const shouldWrapField = Boolean(
      label || supportMessage || hasDecorator || containerClassName || labelClassName || helperClassName
    );
    const showClearButton = clearable && currentValue.length > 0 && !disabled && !readOnly;

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
        className={cn(
          "w-full text-foreground placeholder:text-muted outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
            {prefix ? <span className="flex shrink-0 items-center text-muted">{prefix}</span> : null}
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
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                <span aria-hidden className="text-caption leading-none">
                  ×
                </span>
              </button>
            ) : null}
            {suffix ? <span className="flex shrink-0 items-center text-muted">{suffix}</span> : null}
          </div>
        ) : (
          inputElement
        )}

        {supportMessage ? (
          <p className={cn("text-caption", errorMessage ? "text-danger" : "text-muted", helperClassName)}>
            {supportMessage}
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
