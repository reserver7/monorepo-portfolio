"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Controller } from "react-hook-form";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "../cn";
import {
  SELECT_CONTENT_BASE_CLASS,
  SELECT_DEFAULTS,
  SELECT_ROW_HEIGHT_PX,
  SELECT_SIZE_CLASS,
  SELECT_STATE_CLASS,
  SELECT_TRIGGER_BASE_CLASS,
  SELECT_VARIANT_CLASS
} from "./select.constants";
import {
  buildMultiSelectLabel,
  resolveSelectViewportHeight,
  toSelectKey,
  useFilteredSelectOptions,
  usePopoverTriggerWidth,
  useSelectOptionMaps
} from "./select.hooks";
import type {
  SelectContentProps,
  SelectItemProps,
  SelectPrimitiveValue,
  SelectProps,
  SelectTriggerProps
} from "./select.types";

export const SelectRoot = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(
  (
    {
      className,
      children,
      size = SELECT_DEFAULTS.size,
      variant = SELECT_DEFAULTS.variant,
      state = SELECT_DEFAULTS.state,
      ...props
    },
    ref
  ) => {
    return (
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          SELECT_TRIGGER_BASE_CLASS,
          SELECT_SIZE_CLASS[size],
          SELECT_VARIANT_CLASS[variant],
          SELECT_STATE_CLASS[state],
          className
        )}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="text-muted h-4 w-4 shrink-0" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    );
  }
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(SELECT_CONTENT_BASE_CLASS, className)}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "text-body-sm data-[highlighted]:bg-surface-elevated relative flex h-9 w-full cursor-default select-none items-center rounded-sm pl-8 pr-2 leading-none outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
);
SelectItem.displayName = SelectPrimitive.Item.displayName;

function SelectSingle<T = SelectPrimitiveValue>({
  options,
  value,
  onChange,
  placeholder = SELECT_DEFAULTS.placeholder,
  disabled,
  searchable = SELECT_DEFAULTS.searchable,
  clearable = SELECT_DEFAULTS.clearable,
  loading = SELECT_DEFAULTS.loading,
  emptyMessage = SELECT_DEFAULTS.emptyMessage,
  size = SELECT_DEFAULTS.size,
  variant = SELECT_DEFAULTS.variant,
  state = SELECT_DEFAULTS.state,
  className,
  contentClassName,
  searchPlaceholder = SELECT_DEFAULTS.searchPlaceholder,
  maxVisibleItems = SELECT_DEFAULTS.maxVisibleItems
}: SelectProps<T>) {
  const [query, setQuery] = React.useState("");
  const { optionByKey } = useSelectOptionMaps(options);

  const selectedValueString = React.useMemo(() => {
    if (value == null || Array.isArray(value)) {
      return "";
    }
    return toSelectKey(value);
  }, [value]);

  const filteredOptions = useFilteredSelectOptions(options, query, searchable);

  const handleQueryChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, []);

  const handleValueChange = React.useCallback(
    (nextValueString: string) => {
      const selectedOption = optionByKey.get(nextValueString);
      onChange?.(selectedOption ? selectedOption.value : (nextValueString as unknown as T));
      setQuery("");
    },
    [onChange, optionByKey]
  );

  const handleClear = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onChange?.(null);
    },
    [onChange]
  );

  return (
    <SelectRoot
      value={selectedValueString || undefined}
      onValueChange={handleValueChange}
      disabled={disabled || loading}
    >
      <SelectTrigger size={size} variant={variant} state={state} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {searchable ? (
          <div className="px-2 pb-1 pt-2">
            <input
              value={query}
              onChange={handleQueryChange}
              placeholder={searchPlaceholder}
              className="border-default bg-surface text-body-sm text-foreground focus:border-primary h-8 w-full rounded-md border px-2 outline-none"
            />
          </div>
        ) : null}

        {clearable && selectedValueString ? (
          <button
            type="button"
            className="text-body-sm text-muted hover:bg-surface-elevated hover:text-foreground mb-1 flex h-8 w-full items-center gap-2 rounded-sm px-2"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            선택 해제
          </button>
        ) : null}

        {loading ? (
          <div className="text-body-sm text-muted px-2 py-2">불러오는 중...</div>
        ) : filteredOptions.length === 0 ? (
          <div className="text-body-sm text-muted px-2 py-2">{emptyMessage}</div>
        ) : (
          <div
            className="overflow-auto"
            style={{ maxHeight: resolveSelectViewportHeight(maxVisibleItems, SELECT_ROW_HEIGHT_PX) }}
          >
            {filteredOptions.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </div>
        )}
      </SelectContent>
    </SelectRoot>
  );
}

function SelectMultiple<T = SelectPrimitiveValue>({
  options,
  value,
  onChange,
  placeholder = SELECT_DEFAULTS.placeholder,
  disabled,
  searchable = SELECT_DEFAULTS.searchable,
  clearable = SELECT_DEFAULTS.clearable,
  loading = SELECT_DEFAULTS.loading,
  emptyMessage = SELECT_DEFAULTS.emptyMessage,
  size = SELECT_DEFAULTS.size,
  variant = SELECT_DEFAULTS.variant,
  state = SELECT_DEFAULTS.state,
  className,
  contentClassName,
  searchPlaceholder = SELECT_DEFAULTS.searchPlaceholder,
  maxVisibleItems = SELECT_DEFAULTS.maxVisibleItems
}: SelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const triggerWidth = usePopoverTriggerWidth(triggerRef, open);
  const { labelByKey } = useSelectOptionMaps(options);

  const selectedValues = React.useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const selectedKeys = React.useMemo(() => selectedValues.map((item) => toSelectKey(item)), [selectedValues]);
  const selectedValueSet = React.useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const filteredOptions = useFilteredSelectOptions(options, query, searchable);
  const selectedLabel = React.useMemo(
    () => buildMultiSelectLabel(selectedKeys, labelByKey, placeholder),
    [labelByKey, placeholder, selectedKeys]
  );

  const handleQueryChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, []);

  const toggleValue = React.useCallback(
    (nextValue: T) => {
      const key = toSelectKey(nextValue);
      const next = selectedValues.some((item) => toSelectKey(item) === key)
        ? selectedValues.filter((item) => toSelectKey(item) !== key)
        : [...selectedValues, nextValue];
      onChange?.(next as T[]);
    },
    [onChange, selectedValues]
  );

  const handleClear = React.useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled || loading}
          className={cn(
            SELECT_TRIGGER_BASE_CLASS,
            SELECT_SIZE_CLASS[size],
            SELECT_VARIANT_CLASS[variant],
            SELECT_STATE_CLASS[state],
            className
          )}
        >
          <span className={cn("truncate", selectedValues.length === 0 ? "text-muted" : "text-foreground")}>
            {selectedLabel}
          </span>
          <ChevronDown className="text-muted ml-2 h-4 w-4 shrink-0" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className={cn("border-default bg-surface z-50 rounded-md border p-2 shadow-md", contentClassName)}
          style={{ width: triggerWidth || undefined }}
        >
          {searchable ? (
            <div className="pb-2">
              <input
                value={query}
                onChange={handleQueryChange}
                placeholder={searchPlaceholder}
                className="border-default bg-surface text-body-sm text-foreground focus:border-primary h-8 w-full rounded-md border px-2 outline-none"
              />
            </div>
          ) : null}

          {clearable && selectedValues.length > 0 ? (
            <button
              type="button"
              className="text-body-sm text-muted hover:bg-surface-elevated hover:text-foreground mb-1 flex h-8 w-full items-center gap-2 rounded-sm px-2"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
              선택 해제
            </button>
          ) : null}

          {loading ? (
            <div className="text-body-sm text-muted px-2 py-2">불러오는 중...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="text-body-sm text-muted px-2 py-2">{emptyMessage}</div>
          ) : (
            <div
              className="overflow-auto"
              style={{ maxHeight: resolveSelectViewportHeight(maxVisibleItems, SELECT_ROW_HEIGHT_PX) }}
            >
              {filteredOptions.map((option) => {
                const checked = selectedValueSet.has(toSelectKey(option.value));
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    disabled={option.disabled}
                    className={cn(
                      "text-body-sm text-foreground hover:bg-surface-elevated flex h-9 w-full items-center gap-2 rounded-sm px-2 text-left disabled:cursor-not-allowed disabled:opacity-50",
                      checked ? "bg-surface-elevated" : null
                    )}
                    onClick={() => toggleValue(option.value)}
                  >
                    <span className="border-default bg-surface flex h-4 w-4 items-center justify-center rounded border">
                      {checked ? <Check className="text-primary h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function SelectBase<T = SelectPrimitiveValue>(props: SelectProps<T>) {
  if (props.multiple) {
    return <SelectMultiple {...props} />;
  }

  return <SelectSingle {...props} />;
}

export function Select<T = SelectPrimitiveValue>(props: SelectProps<T>) {
  const { control, rules, name, onChange, ...rest } = props;

  if (control && typeof name === "string" && name.length > 0) {
    return (
      <Controller
        control={control as any}
        name={name as any}
        rules={rules}
        render={({ field }) => (
          <SelectBase<T>
            {...(rest as SelectProps<T>)}
            name={field.name}
            value={(field.value as T | T[] | null) ?? null}
            onChange={(value) => {
              field.onChange(value);
              onChange?.(value);
            }}
          />
        )}
      />
    );
  }

  return <SelectBase {...props} />;
}
