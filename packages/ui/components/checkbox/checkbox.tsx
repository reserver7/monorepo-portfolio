"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Controller } from "react-hook-form";
import { Check, Minus } from "lucide-react";
import { cn } from "../cn";
import { FieldSupportText } from "../field/field-utils";
import { Label } from "../label";
import {
  CHECKBOX_BASE_CLASS,
  CHECKBOX_DEFAULTS,
  CHECKBOX_ICON_SIZE_CLASS,
  CHECKBOX_SIZE_CLASS
} from "./checkbox.constants";
import { toBooleanChecked } from "./checkbox.hooks";
import type { CheckboxProps } from "./checkbox.types";

function CheckboxBase(
  {
    className,
    size = CHECKBOX_DEFAULTS.size,
    checked,
    defaultChecked,
    onCheckedChange,
    indeterminate = CHECKBOX_DEFAULTS.indeterminate,
    label,
    helperText,
    errorMessage,
    required,
    containerClassName,
    labelClassName,
    helperClassName,
    id,
    name,
    disabled,
    ...props
  }: CheckboxProps,
  ref: React.ForwardedRef<React.ElementRef<typeof CheckboxPrimitive.Root>>
) {
  const generatedId = React.useId();
  const resolvedId = id ?? `checkbox-${generatedId}`;
  const supportText = errorMessage ?? helperText ?? (required && !label ? "필수 체크 항목입니다." : undefined);
  const hasWrapper = Boolean(required || label || supportText || containerClassName || labelClassName || helperClassName);

  const icon = indeterminate ? <Minus className={CHECKBOX_ICON_SIZE_CLASS[size]} /> : <Check className={CHECKBOX_ICON_SIZE_CLASS[size]} />;

  const checkboxNode = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={resolvedId}
      name={name}
      required={required}
      disabled={disabled}
      checked={indeterminate ? "indeterminate" : checked}
      defaultChecked={indeterminate ? undefined : defaultChecked}
      onCheckedChange={(next) => onCheckedChange?.(toBooleanChecked(next))}
      aria-checked={indeterminate ? "mixed" : undefined}
      className={cn(
        CHECKBOX_BASE_CLASS,
        CHECKBOX_SIZE_CLASS[size],
        "shadow-none ring-offset-surface",
        errorMessage ? "border-danger/50 focus-visible:ring-danger/20" : null,
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">{icon}</CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!hasWrapper) {
    return checkboxNode;
  }

  return (
    <div className={cn("grid gap-1", containerClassName)}>
      <div className="flex items-center gap-2">
        {checkboxNode}
        {label ? (
          <Label htmlFor={resolvedId} size="sm" className={cn("cursor-pointer leading-5", labelClassName)}>
            <span>{label}</span>
            {required ? <span className="text-danger ml-1">*</span> : null}
          </Label>
        ) : required ? (
          <>
            <span aria-hidden className="text-danger leading-none">
              *
            </span>
            <span className="sr-only">필수 체크 항목</span>
          </>
        ) : null}
      </div>
      <FieldSupportText
        message={supportText}
        error={Boolean(errorMessage)}
        className={cn(size === "md" ? "pl-7" : "pl-6", helperClassName)}
      />
    </div>
  );
}

const CheckboxBaseWithRef = React.forwardRef(CheckboxBase);
CheckboxBaseWithRef.displayName = "CheckboxBase";

export const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>((props, ref) => {
  const { control, rules, name, onCheckedChange, checked, defaultChecked, required, ...rest } = props;
  const mergedRules = React.useMemo<CheckboxProps["rules"]>(() => {
    if (!required || rules?.required) return rules;
    return { required: "필수 체크 항목입니다.", ...rules };
  }, [required, rules]);

  if (control && typeof name === "string" && name.length > 0) {
    return (
      <Controller
        control={control as any}
        name={name as any}
        rules={mergedRules}
        render={({ field }) => (
          <CheckboxBaseWithRef
            {...rest}
            required={required}
            ref={ref}
            name={field.name}
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
    <CheckboxBaseWithRef
      {...rest}
      required={required}
      ref={ref}
      name={name}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
    />
  );
});
Checkbox.displayName = "Checkbox";
