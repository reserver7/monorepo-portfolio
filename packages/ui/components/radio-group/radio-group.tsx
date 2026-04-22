"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Controller } from "react-hook-form";
import { Circle } from "lucide-react";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import { FieldSupportText, RequiredMark } from "../field/field-utils";
import { Label } from "../label";
import {
  RADIO_GROUP_DEFAULTS,
  RADIO_GROUP_INDICATOR_SIZE_CLASS,
  RADIO_GROUP_ITEM_BASE_CLASS,
  RADIO_GROUP_SIZE_CLASS
} from "./radio-group.constants";
import type { RadioGroupItemProps, RadioGroupProps } from "./radio-group.types";

const RadioGroupItem = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Item>, RadioGroupItemProps>(
  ({ className, size = RADIO_GROUP_DEFAULTS.size, ...props }, ref) => {
    const resolvedSize = resolveOption(size, RADIO_GROUP_SIZE_CLASS, RADIO_GROUP_DEFAULTS.size);
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(RADIO_GROUP_ITEM_BASE_CLASS, RADIO_GROUP_SIZE_CLASS[resolvedSize], className)}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <Circle className={cn("fill-current text-current", RADIO_GROUP_INDICATOR_SIZE_CLASS[resolvedSize])} />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

const Radio = RadioGroupItem;

function RadioGroupBase(
  {
    className,
    options,
    value,
    defaultValue,
    onValueChange,
    size = RADIO_GROUP_DEFAULTS.size,
    orientation = RADIO_GROUP_DEFAULTS.orientation,
    helperText,
    errorMessage,
    required,
    containerClassName,
    helperClassName,
    optionClassName,
    optionLabelClassName,
    disabled,
    ...props
  }: RadioGroupProps,
  ref: React.ForwardedRef<React.ElementRef<typeof RadioGroupPrimitive.Root>>
) {
  const generatedName = React.useId();
  const resolvedName = props.name ?? `radio-group-${generatedName}`;
  const supportText = errorMessage ?? helperText ?? (required ? "필수 선택 항목입니다." : undefined);
  const resolvedSize = resolveOption(size, RADIO_GROUP_SIZE_CLASS, RADIO_GROUP_DEFAULTS.size);
  const itemTopOffset = resolvedSize === "md" ? "mt-[2px]" : "mt-px";
  const resolvedOrientation = resolveOption(orientation, { horizontal: true, vertical: true }, RADIO_GROUP_DEFAULTS.orientation);
  const optionNodes = React.useMemo(
    () =>
      options?.map((option) => {
        const optionId = `${resolvedName}-${option.value}`;
        return (
          <div key={option.value} className={cn("flex items-start gap-2.5", optionClassName)}>
            <RadioGroupItem
              id={optionId}
              value={option.value}
              size={resolvedSize}
              disabled={disabled || option.disabled}
              className={cn(itemTopOffset, errorMessage ? "border-danger/50 focus-visible:ring-danger/20" : undefined)}
            />
            <Label htmlFor={optionId} size="sm" className={cn("cursor-pointer leading-5", optionLabelClassName)}>
              <span>{option.label}</span>
            </Label>
          </div>
        );
      }) ?? [],
    [disabled, errorMessage, itemTopOffset, optionClassName, optionLabelClassName, options, resolvedName, resolvedSize]
  );

  const groupNode = (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn(
        resolvedOrientation === "horizontal" ? "flex flex-wrap items-start gap-x-4 gap-y-2.5" : "grid gap-2.5",
        className
      )}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={resolvedName}
      required={required}
      disabled={disabled}
      {...props}
    >
      {optionNodes}
    </RadioGroupPrimitive.Root>
  );

  return (
    <div className={cn("grid gap-[var(--space-1)]", containerClassName)}>
      {required ? (
        <RequiredMark />
      ) : null}
      {groupNode}
      <FieldSupportText
        message={supportText}
        error={Boolean(errorMessage)}
        className={helperClassName}
      />
    </div>
  );
}

const RadioGroupBaseWithRef = React.forwardRef(RadioGroupBase);
RadioGroupBaseWithRef.displayName = "RadioGroupBase";

const RadioGroupComponent = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Root>, RadioGroupProps>(
  (props, ref) => {
    const { control, rules, name, onValueChange, value, defaultValue, required, ...rest } = props;
    const mergedRules = React.useMemo<RadioGroupProps["rules"]>(() => {
      if (!required || rules?.required) return rules;
      return { required: "필수 선택 항목입니다.", ...rules };
    }, [required, rules]);

    if (control && typeof name === "string" && name.length > 0) {
      return (
        <Controller
          control={control as any}
          name={name as any}
          rules={mergedRules}
          render={({ field }) => (
            <RadioGroupBaseWithRef
              {...rest}
              required={required}
              ref={ref}
              name={field.name}
              value={field.value == null ? "" : String(field.value)}
              onValueChange={(next) => {
                field.onChange(next);
                onValueChange?.(next);
              }}
              onBlur={field.onBlur}
            />
          )}
        />
      );
    }

    return (
      <RadioGroupBaseWithRef
        {...rest}
        required={required}
        ref={ref}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
      />
    );
  }
);
RadioGroupComponent.displayName = "RadioGroup";

export const RadioGroup = React.memo(RadioGroupComponent);
RadioGroup.displayName = "RadioGroup";

export { Radio, RadioGroupItem };
