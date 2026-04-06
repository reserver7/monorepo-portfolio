"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Controller } from "react-hook-form";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../cn";
import {
  SELECT_CONTENT_BASE_CLASS,
  SELECT_DEFAULTS,
  SELECT_POPOVER_CONTENT_BASE_CLASS,
  SELECT_ROW_HEIGHT_PX,
  SELECT_SCROLL_LIST_CLASS,
  SELECT_SIZE_CLASS,
  SELECT_STATE_CLASS,
  SELECT_TRIGGER_BASE_CLASS,
  SELECT_VARIANT_CLASS
} from "./select.constants";
import {
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
>(({ className, children, position = "popper", sideOffset = 0, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={sideOffset}
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
        "text-body-sm data-[highlighted]:bg-surface-elevated data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary relative flex h-9 w-full cursor-default select-none items-center justify-between gap-2 rounded-md px-3 leading-none outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="truncate">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
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
  loading = SELECT_DEFAULTS.loading,
  emptyMessage = SELECT_DEFAULTS.emptyMessage,
  size = SELECT_DEFAULTS.size,
  variant = SELECT_DEFAULTS.variant,
  state = SELECT_DEFAULTS.state,
  status,
  errorMessage,
  className,
  contentClassName,
  maxVisibleItems = SELECT_DEFAULTS.maxVisibleItems
}: SelectProps<T>) {
  const activeState = status ?? (errorMessage ? "error" : state);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const triggerWidth = usePopoverTriggerWidth(triggerRef, open);
  const { optionByKey } = useSelectOptionMaps(options);
  const [internalValue, setInternalValue] = React.useState<string>("");
  const isControlled = value !== undefined;

  const selectedValueString = React.useMemo(() => {
    if (value == null || Array.isArray(value)) {
      return "";
    }
    return toSelectKey(value);
  }, [value]);
  const selectedKey = isControlled ? selectedValueString : internalValue;
  const filteredOptions = useFilteredSelectOptions(options, query, searchable);
  const selectedOptionLabel = selectedKey ? optionByKey.get(selectedKey)?.label : null;
  const viewportStyle = React.useMemo(
    () => ({ maxHeight: resolveSelectViewportHeight(maxVisibleItems, SELECT_ROW_HEIGHT_PX) }),
    [maxVisibleItems]
  );
  const isDisabled = Boolean(disabled || loading);

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
  }, []);

  const handleValueChange = React.useCallback(
    (nextValueString: string) => {
      const selectedOption = optionByKey.get(nextValueString);
      if (!isControlled) {
        setInternalValue(nextValueString);
      }
      onChange?.(selectedOption ? selectedOption.value : (nextValueString as unknown as T));
    },
    [isControlled, onChange, optionByKey]
  );

  React.useEffect(() => {
    if (!searchable || !open) return;
    const timer = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(timer);
  }, [open, searchable]);

  if (searchable) {
    return (
      <PopoverPrimitive.Root
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery("");
          }
        }}
      >
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            disabled={isDisabled}
            className={cn(
              SELECT_TRIGGER_BASE_CLASS,
              SELECT_SIZE_CLASS[size],
              SELECT_VARIANT_CLASS[variant],
              SELECT_STATE_CLASS[activeState],
              className
            )}
          >
            {open ? (
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                placeholder={placeholder}
                className="text-body-sm text-foreground placeholder:text-muted min-w-0 flex-1 border-0 bg-transparent p-0 outline-none"
              />
            ) : selectedOptionLabel ? (
              <span className="truncate">{selectedOptionLabel}</span>
            ) : (
              <span className="text-muted truncate">{placeholder}</span>
            )}
            <ChevronDown className="text-muted ml-2 h-4 w-4 shrink-0" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={0}
            className={cn(SELECT_POPOVER_CONTENT_BASE_CLASS, contentClassName)}
            style={{ width: triggerWidth || undefined }}
          >
            {loading ? (
              <div className="text-body-sm text-muted px-2 py-2">불러오는 중...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-body-sm text-muted px-2 py-2">{emptyMessage}</div>
            ) : (
              <div className={SELECT_SCROLL_LIST_CLASS} style={viewportStyle}>
                {filteredOptions.map((option) => {
                  const key = toSelectKey(option.value);
                  const checked = key === selectedKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={option.disabled}
                      className={cn(
                        "text-body-sm data-[highlighted]:bg-surface-elevated relative flex h-9 w-full items-center justify-between gap-2 rounded-md px-3 text-left disabled:cursor-not-allowed disabled:opacity-50",
                        checked ? "bg-primary/10 text-primary" : "text-foreground hover:bg-surface-elevated"
                      )}
                      onClick={() => {
                        handleValueChange(key);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="truncate">{option.label}</span>
                      {checked ? <Check className="h-4 w-4" /> : null}
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

  return (
    <SelectRoot
      value={selectedKey || undefined}
      onValueChange={handleValueChange}
      disabled={isDisabled}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger size={size} variant={variant} state={activeState} className={className}>
        <span className="flex min-w-0 flex-1 items-center gap-1">
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {loading ? (
          <div className="text-body-sm text-muted px-2 py-2">불러오는 중...</div>
        ) : (
          <div
            className={SELECT_SCROLL_LIST_CLASS}
            style={{ maxHeight: resolveSelectViewportHeight(maxVisibleItems, SELECT_ROW_HEIGHT_PX) }}
          >
            {options.map((option) => (
              <SelectItem key={toSelectKey(option.value)} value={toSelectKey(option.value)} disabled={option.disabled}>
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
  loading = SELECT_DEFAULTS.loading,
  emptyMessage = SELECT_DEFAULTS.emptyMessage,
  size = SELECT_DEFAULTS.size,
  variant = SELECT_DEFAULTS.variant,
  state = SELECT_DEFAULTS.state,
  status,
  errorMessage,
  className,
  contentClassName,
  maxVisibleItems = SELECT_DEFAULTS.maxVisibleItems,
  maxTagCount = SELECT_DEFAULTS.maxTagCount
}: SelectProps<T>) {
  const activeState = status ?? (errorMessage ? "error" : state);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [internalValues, setInternalValues] = React.useState<T[]>([]);
  const isControlled = value !== undefined;
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const triggerWidth = usePopoverTriggerWidth(triggerRef, open);
  const { labelByKey } = useSelectOptionMaps(options);

  const selectedValues = React.useMemo(() => {
    if (isControlled) {
      return Array.isArray(value) ? value : [];
    }
    return internalValues;
  }, [internalValues, isControlled, value]);
  const selectedKeys = React.useMemo(() => selectedValues.map((item) => toSelectKey(item)), [selectedValues]);
  const selectedValueSet = React.useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const selectableOptions = React.useMemo(() => options.filter((option) => !option.disabled), [options]);
  const selectableKeys = React.useMemo(() => selectableOptions.map((option) => toSelectKey(option.value)), [selectableOptions]);
  const selectedSelectableCount = React.useMemo(
    () => selectableKeys.filter((key) => selectedValueSet.has(key)).length,
    [selectableKeys, selectedValueSet]
  );
  const isAllSelected = selectableKeys.length > 0 && selectedSelectableCount === selectableKeys.length;
  const filteredOptions = useFilteredSelectOptions(options, query, searchable);
  const visibleTagKeys = React.useMemo(
    () => selectedKeys.slice(0, Math.max(0, maxTagCount)),
    [maxTagCount, selectedKeys]
  );
  const hiddenTagCount = Math.max(0, selectedKeys.length - visibleTagKeys.length);
  const shouldShowSearchInput = searchable && open;
  const viewportStyle = React.useMemo(
    () => ({ maxHeight: resolveSelectViewportHeight(maxVisibleItems, SELECT_ROW_HEIGHT_PX) }),
    [maxVisibleItems]
  );
  const isDisabled = Boolean(disabled || loading);

  const handleQueryChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, []);

  const toggleValue = React.useCallback(
    (nextValue: T) => {
      const key = toSelectKey(nextValue);
      const next = selectedValues.some((item) => toSelectKey(item) === key)
        ? selectedValues.filter((item) => toSelectKey(item) !== key)
        : [...selectedValues, nextValue];
      if (!isControlled) {
        setInternalValues(next);
      }
      onChange?.(next as T[]);
    },
    [isControlled, onChange, selectedValues]
  );

  const handleClear = React.useCallback(() => {
    if (!isControlled) {
      setInternalValues([]);
    }
    onChange?.([]);
  }, [isControlled, onChange]);

  const handleToggleAll = React.useCallback(() => {
    if (isAllSelected) {
      handleClear();
      return;
    }

    const allValues = selectableOptions.map((option) => option.value as T);
    if (!isControlled) {
      setInternalValues(allValues);
    }
    onChange?.(allValues);
  }, [handleClear, isAllSelected, isControlled, onChange, selectableOptions]);

  React.useEffect(() => {
    if (!shouldShowSearchInput) return;
    const timer = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(timer);
  }, [shouldShowSearchInput]);

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          disabled={isDisabled}
          className={cn(
            SELECT_TRIGGER_BASE_CLASS,
            SELECT_SIZE_CLASS[size],
            SELECT_VARIANT_CLASS[variant],
            SELECT_STATE_CLASS[activeState],
            "min-h-10 h-auto py-1.5",
            className
          )}
        >
          {shouldShowSearchInput ? (
            <input
              ref={searchInputRef}
              value={query}
              onChange={handleQueryChange}
              onClick={(event) => {
                event.stopPropagation();
              }}
              placeholder={placeholder}
              className="text-body-sm text-foreground placeholder:text-muted min-w-0 flex-1 border-0 bg-transparent p-0 outline-none"
            />
          ) : selectedValues.length === 0 ? (
            <span className="text-muted truncate">{placeholder}</span>
          ) : (
            <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
              {visibleTagKeys.map((key) => (
                <span
                  key={key}
                  className="bg-primary/10 text-primary inline-flex max-w-[9rem] shrink-0 items-center rounded-md px-2.5 py-0.5 text-[11px] font-medium"
                >
                  <span className="truncate">{labelByKey.get(key) ?? key}</span>
                </span>
              ))}
              {hiddenTagCount > 0 ? (
                <span className="bg-surface-elevated text-muted inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-medium">
                  +{hiddenTagCount}
                </span>
              ) : null}
            </span>
          )}
          <ChevronDown className="text-muted ml-2 h-4 w-4 shrink-0" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={0}
          className={cn(SELECT_POPOVER_CONTENT_BASE_CLASS, contentClassName)}
          style={{ width: triggerWidth || undefined }}
        >
          <button
            type="button"
            className="text-body-sm text-muted hover:bg-surface-elevated hover:text-foreground mb-1 flex h-8 w-full items-center justify-between gap-2 rounded-md px-3"
            onClick={handleToggleAll}
          >
            <span>{isAllSelected ? "전체 해제" : "전체 선택"}</span>
            <span className="text-caption text-muted">{selectedSelectableCount}/{selectableKeys.length}</span>
          </button>

          {loading ? (
            <div className="text-body-sm text-muted px-2 py-2">불러오는 중...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="text-body-sm text-muted px-2 py-2">{emptyMessage}</div>
          ) : (
            <div className={SELECT_SCROLL_LIST_CLASS} style={viewportStyle}>
              {filteredOptions.map((option) => {
                const checked = selectedValueSet.has(toSelectKey(option.value));
                return (
                  <button
                    key={toSelectKey(option.value)}
                    type="button"
                    disabled={option.disabled}
                    className={cn(
                      "text-body-sm text-foreground hover:bg-surface-elevated flex h-9 w-full items-center gap-2 rounded-md px-3 text-left disabled:cursor-not-allowed disabled:opacity-50",
                      checked ? "bg-primary/10 text-primary" : null
                    )}
                    onClick={() => toggleValue(option.value)}
                  >
                    <span
                      className={cn(
                        "border-default bg-surface flex h-4 w-4 items-center justify-center rounded border",
                        checked ? "border-primary/40 bg-primary/10" : null
                      )}
                    >
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
