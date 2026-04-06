"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import type { DateRange } from "react-day-picker";
import { CalendarDays, X } from "lucide-react";
import { useComposedRefs } from "../../hooks";
import { cn } from "../cn";
import { Button } from "../button";
import { Calendar } from "../calendar";
import { FieldSupportText, RequiredMark } from "../field/field-utils";
import { INPUT_DEFAULTS, INPUT_SIZE_CLASS, INPUT_STATUS_CLASS, INPUT_VARIANT_CLASS } from "../input/input.constants";
import { resolveInputStatus } from "../input/input.hooks";
import { Label } from "../label";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { DATE_PICKER_DEFAULTS } from "./date-picker.constants";
import {
  formatDateInputValue,
  formatDateText,
  parseDateValue,
  toDateInputValue,
  toDateRangeValue
} from "./date-picker.hooks";
import type { DatePickerFieldProps, DatePickerProps, DateRangeStringValue } from "./date-picker.types";

const DatePickerBase = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      mode = DATE_PICKER_DEFAULTS.mode,
      value,
      defaultValue,
      range,
      defaultRange,
      minDate,
      maxDate,
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
      clearable = DATE_PICKER_DEFAULTS.clearable,
      placeholder = DATE_PICKER_DEFAULTS.placeholder,
      locale = DATE_PICKER_DEFAULTS.locale,
      showIcon = DATE_PICKER_DEFAULTS.showIcon,
      icon,
      id,
      name,
      onBlur,
      onChange,
      className,
      onValueChange,
      onRangeChange,
      containerClassName,
      labelClassName,
      helperClassName
    },
    ref
  ) => {
    const hiddenInputRef = React.useRef<HTMLInputElement | null>(null);
    const mergedRef = useComposedRefs<HTMLInputElement>(ref, hiddenInputRef);

    const isRangeMode = mode === "range";
    const [isOpen, setIsOpen] = React.useState(false);
    const minDateValue = React.useMemo(() => parseDateValue(minDate), [minDate]);
    const maxDateValue = React.useMemo(() => parseDateValue(maxDate), [maxDate]);

    const controlledSingleValue = React.useMemo(() => toDateInputValue(value), [value]);
    const [internalSingleValue, setInternalSingleValue] = React.useState<string | undefined>(() =>
      toDateInputValue(defaultValue)
    );
    const isSingleControlled = value !== undefined;
    const currentSingleValue = isSingleControlled ? controlledSingleValue : internalSingleValue;
    const selectedDate = React.useMemo(() => parseDateValue(currentSingleValue), [currentSingleValue]);

    const controlledRangeValue = React.useMemo(() => toDateRangeValue(range), [range]);
    const [internalRangeValue, setInternalRangeValue] = React.useState<DateRangeStringValue>(() =>
      toDateRangeValue(defaultRange)
    );
    const isRangeControlled = range !== undefined;
    const currentRangeValue = isRangeControlled ? controlledRangeValue : internalRangeValue;

    const selectedRange = React.useMemo<DateRange | undefined>(() => {
      if (!isRangeMode) return undefined;
      const from = parseDateValue(currentRangeValue.from);
      const to = parseDateValue(currentRangeValue.to);
      if (!from && !to) return undefined;
      return { from, to };
    }, [currentRangeValue.from, currentRangeValue.to, isRangeMode]);

    const activeStatus = resolveInputStatus(status, state, Boolean(errorMessage));
    const generatedId = React.useId();
    const resolvedId = id ?? `date-picker-${generatedId}`;
    const supportText = errorMessage ?? helperText;

    const emitSingleChange = React.useCallback(
      (nextValue: string) => {
        if (!isSingleControlled) {
          setInternalSingleValue(nextValue || undefined);
        }
        onValueChange?.(nextValue);

        if (onChange) {
          const syntheticEvent = {
            target: { value: nextValue, name, id: resolvedId },
            currentTarget: { value: nextValue, name, id: resolvedId }
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      },
      [id, isSingleControlled, name, onChange, onValueChange, resolvedId]
    );

    const emitRangeChange = React.useCallback(
      (nextRange: DateRangeStringValue) => {
        if (!isRangeControlled) {
          setInternalRangeValue(nextRange);
        }
        onRangeChange?.(nextRange);

        if (onChange) {
          const syntheticEvent = {
            target: {
              value: `${nextRange.from ?? ""}~${nextRange.to ?? ""}`,
              name,
              id: resolvedId
            },
            currentTarget: {
              value: `${nextRange.from ?? ""}~${nextRange.to ?? ""}`,
              name,
              id: resolvedId
            }
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      },
      [id, isRangeControlled, name, onChange, onRangeChange, resolvedId]
    );

    const handleSingleSelect = React.useCallback(
      (nextDate: Date | undefined) => {
        const nextValue = nextDate ? formatDateInputValue(nextDate) : "";
        emitSingleChange(nextValue);
        if (nextDate) {
          setIsOpen(false);
        }
      },
      [emitSingleChange]
    );

    const handleRangeSelect = React.useCallback(
      (nextRange: DateRange | undefined) => {
        const nextValue: DateRangeStringValue = {
          from: nextRange?.from ? formatDateInputValue(nextRange.from) : undefined,
          to: nextRange?.to ? formatDateInputValue(nextRange.to) : undefined
        };
        emitRangeChange(nextValue);
        if (nextRange?.from && nextRange?.to) {
          setIsOpen(false);
        }
      },
      [emitRangeChange]
    );

    const handleClear = React.useCallback(() => {
      if (isRangeMode) {
        emitRangeChange({});
        return;
      }
      emitSingleChange("");
    }, [emitRangeChange, emitSingleChange, isRangeMode]);

    const triggerLabel = React.useMemo(() => {
      if (isRangeMode) {
        const from = parseDateValue(currentRangeValue.from);
        const to = parseDateValue(currentRangeValue.to);
        if (from && to) {
          return `${formatDateText(from, locale)} ~ ${formatDateText(to, locale)}`;
        }
        if (from) {
          return `${formatDateText(from, locale)} ~`;
        }
        return DATE_PICKER_DEFAULTS.rangePlaceholder;
      }

      return selectedDate ? formatDateText(selectedDate, locale) : placeholder;
    }, [currentRangeValue.from, currentRangeValue.to, isRangeMode, locale, placeholder, selectedDate]);

    const showClearButton =
      clearable &&
      !disabled &&
      !readOnly &&
      (isRangeMode ? Boolean(currentRangeValue.from || currentRangeValue.to) : Boolean(selectedDate));

    const shouldRenderCalendar = isOpen && !disabled && !readOnly;

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

        <Popover
          open={isOpen}
          onOpenChange={(nextOpen) => {
            if (readOnly || disabled) {
              setIsOpen(false);
              return;
            }
            setIsOpen(nextOpen);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id={resolvedId}
              type="button"
              variant="outline"
              disabled={disabled}
              onBlur={(event) => {
                onBlur?.(event as unknown as React.FocusEvent<HTMLInputElement>);
              }}
              className={cn(
                "h-10 w-full justify-between px-3 py-0 font-normal leading-none",
                INPUT_SIZE_CLASS[size],
                INPUT_VARIANT_CLASS[variant],
                INPUT_STATUS_CLASS[activeStatus],
                triggerLabel !== placeholder && triggerLabel !== DATE_PICKER_DEFAULTS.rangePlaceholder
                  ? "text-foreground"
                  : "text-muted",
                readOnly ? "cursor-default bg-surface text-muted hover:bg-surface active:bg-surface" : null,
                className
              )}
            >
              <span className="truncate text-left">{triggerLabel}</span>
              <span className="flex shrink-0 items-center gap-1">
                {showClearButton ? (
                  <span
                    role="button"
                    tabIndex={-1}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleClear();
                    }}
                    aria-label="선택한 날짜 지우기"
                    className="text-muted hover:bg-surface-elevated hover:text-foreground inline-flex h-5 w-5 items-center justify-center rounded transition-colors"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : null}
                {showIcon ? (icon ?? <CalendarDays className="h-4 w-4" aria-hidden />) : null}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={0} className="w-auto p-0">
            {shouldRenderCalendar && isRangeMode ? (
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={handleRangeSelect as (value: unknown) => void}
                disabled={disabled || readOnly}
                fromDate={minDateValue}
                toDate={maxDateValue}
                initialFocus
              />
            ) : null}
            {shouldRenderCalendar && !isRangeMode ? (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSingleSelect}
                disabled={disabled || readOnly}
                fromDate={minDateValue}
                toDate={maxDateValue}
                initialFocus
              />
            ) : null}
          </PopoverContent>
        </Popover>

        <FieldSupportText
          message={supportText}
          error={Boolean(errorMessage)}
          className={helperClassName}
        />

        {!isRangeMode ? (
          <input ref={mergedRef} type="hidden" name={name} value={currentSingleValue ?? ""} required={required} />
        ) : (
          <>
            <input
              ref={mergedRef}
              type="hidden"
              name={name ? `${name}.from` : undefined}
              value={currentRangeValue.from ?? ""}
              required={required}
            />
            <input
              type="hidden"
              name={name ? `${name}.to` : undefined}
              value={currentRangeValue.to ?? ""}
              required={required}
            />
          </>
        )}
      </div>
    );
  }
);
DatePickerBase.displayName = "DatePickerBase";

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>((props, ref) => {
  const { control, rules, name, mode = DATE_PICKER_DEFAULTS.mode, onValueChange, onRangeChange, onBlur, ...rest } = props;

  if (control && typeof name === "string" && name.length > 0) {
    return (
      <Controller
        control={control as any}
        name={name as any}
        rules={rules}
        render={({ field }) => {
          if (mode === "range") {
            return (
              <DatePickerBase
                {...rest}
                ref={ref}
                mode="range"
                name={field.name}
                range={(field.value as DateRangeStringValue | undefined) ?? {}}
                onRangeChange={(nextRange) => {
                  field.onChange(nextRange);
                  onRangeChange?.(nextRange);
                }}
                onBlur={(event) => {
                  field.onBlur();
                  onBlur?.(event);
                }}
              />
            );
          }

          return (
            <DatePickerBase
              {...rest}
              ref={ref}
              mode="single"
              name={field.name}
              value={field.value == null ? undefined : String(field.value)}
              onValueChange={(nextValue) => {
                field.onChange(nextValue);
                onValueChange?.(nextValue);
              }}
              onBlur={(event) => {
                field.onBlur();
                onBlur?.(event);
              }}
            />
          );
        }}
      />
    );
  }

  return (
    <DatePickerBase
      {...rest}
      ref={ref}
      mode={mode}
      name={name}
      onValueChange={onValueChange}
      onRangeChange={onRangeChange}
      onBlur={onBlur}
    />
  );
});
DatePicker.displayName = "DatePicker";

export const DatePickerField = React.forwardRef<HTMLInputElement, DatePickerFieldProps>(
  (
    {
      id,
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
    },
    ref
  ) => {
    const generatedId = React.useId();
    const resolvedId = id ?? `date-picker-${generatedId}`;

    return (
      <>
        <DatePicker
          ref={ref}
          id={resolvedId}
          required={required}
          label={label}
          helperText={helperText}
          errorMessage={errorMessage}
          containerClassName={containerClassName}
          labelClassName={labelClassName}
          helperClassName={helperClassName}
          {...props}
        />
        {description ? <p className={cn("text-caption text-muted", descriptionClassName)}>{description}</p> : null}
      </>
    );
  }
);
DatePickerField.displayName = "DatePickerField";
