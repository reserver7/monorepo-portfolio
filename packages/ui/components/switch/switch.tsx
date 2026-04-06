"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Controller } from "react-hook-form";
import { cn } from "../cn";
import { FieldSupportText } from "../field/field-utils";
import { Label } from "../label";
import { SWITCH_COLOR_CLASS, SWITCH_DEFAULTS, SWITCH_SIZE_CLASS } from "./switch.constants";
import { mergeSwitchRules } from "./switch.hooks";
import type { SwitchFieldProps, SwitchProps } from "./switch.types";

const SwitchBase = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  (
    {
      className,
      size = SWITCH_DEFAULTS.size,
      color = SWITCH_DEFAULTS.color,
      loading = SWITCH_DEFAULTS.loading,
      disabled,
      onCheckedChange,
      ...props
    },
    ref
  ) => (
    <SwitchPrimitives.Root
      className={cn(
        "bg-surface-elevated ring-offset-surface peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        SWITCH_SIZE_CLASS[size].root,
        SWITCH_COLOR_CLASS[color],
        className
      )}
      disabled={disabled || loading}
      onCheckedChange={onCheckedChange}
      data-loading={loading ? "true" : undefined}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow transition-transform data-[state=unchecked]:translate-x-0",
          SWITCH_SIZE_CLASS[size].thumb,
          SWITCH_SIZE_CLASS[size].checked
        )}
      />
    </SwitchPrimitives.Root>
  )
);
SwitchBase.displayName = "SwitchBase";

export const Switch = SwitchBase;

function SwitchFieldBase(
  {
    id,
    name,
    label,
    description,
    helperText,
    errorMessage,
    required,
    containerClassName,
    labelClassName,
    descriptionClassName,
    helperClassName,
    ...props
  }: SwitchFieldProps,
  ref: React.ForwardedRef<React.ElementRef<typeof SwitchPrimitives.Root>>
) {
  const generatedId = React.useId();
  const resolvedId = id ?? `switch-${generatedId}`;
  const supportText = errorMessage ?? helperText ?? (required && !label ? "필수 설정 항목입니다." : undefined);

  return (
    <div className={cn("grid gap-1.5", containerClassName)}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-0.5">
          {label ? (
            <Label htmlFor={resolvedId} size="sm" className={cn("cursor-pointer leading-5", labelClassName)}>
              <span>{label}</span>
              {required ? <span className="text-danger ml-1">*</span> : null}
            </Label>
          ) : required ? (
            <div className="flex justify-start">
              <span aria-hidden className="text-danger leading-none">
                *
              </span>
              <span className="sr-only">필수 설정 항목</span>
            </div>
          ) : null}
          {description ? (
            <p className={cn("text-caption text-muted leading-5", descriptionClassName)}>{description}</p>
          ) : null}
        </div>
        <SwitchBase ref={ref} id={resolvedId} name={name} required={required} {...props} />
      </div>
      <FieldSupportText
        message={supportText}
        error={Boolean(errorMessage)}
        className={helperClassName}
      />
    </div>
  );
}

const SwitchFieldBaseWithRef = React.forwardRef(SwitchFieldBase);
SwitchFieldBaseWithRef.displayName = "SwitchFieldBase";

export const SwitchField = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchFieldProps>(
  (props, ref) => {
    const { control, rules, name, required, onCheckedChange, checked, defaultChecked, ...rest } = props;
    const mergedRules = React.useMemo(() => mergeSwitchRules(required, rules), [required, rules]);

    if (control && typeof name === "string" && name.length > 0) {
      return (
        <Controller
          control={control as any}
          name={name as any}
          rules={mergedRules}
          render={({ field }) => (
            <SwitchFieldBaseWithRef
              {...rest}
              ref={ref}
              name={field.name}
              required={required}
              checked={Boolean(field.value)}
              onCheckedChange={(next) => {
                field.onChange(next);
                onCheckedChange?.(next);
              }}
              onBlur={field.onBlur}
            />
          )}
        />
      );
    }

    return (
      <SwitchFieldBaseWithRef
        {...rest}
        ref={ref}
        name={name}
        required={required}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
      />
    );
  }
);
SwitchField.displayName = "SwitchField";
