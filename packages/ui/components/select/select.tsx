"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Controller } from "react-hook-form";
import { Check, ChevronDown } from "lucide-react";
import { useControlledValue } from "../../hooks";
import { resolveOption } from "../internal/resolve-option";
import { cn } from "../cn";
import {
  SELECT_CONTENT_BASE_CLASS,
  SELECT_DEFAULTS,
  SELECT_POPOVER_CONTENT_BASE_CLASS,
  SELECT_ROW_HEIGHT_PX,
  SELECT_SCROLL_LIST_CLASS,
  SELECT_SIZE_CLASS,
  SELECT_STATUS_CLASS,
  SELECT_TRIGGER_BASE_CLASS,
  SELECT_VARIANT_CLASS
} from "./select.constants";
import {
  useFilteredSelectOptions,
  useKeyedSelectOptions,
  usePopoverTriggerWidth,
  useSelectOptionMaps
} from "./select.hooks";
import { resolveSelectViewportHeight, toSelectKey } from "./select.utils";
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
      status = SELECT_DEFAULTS.status,
      ...props
    },
    ref
  ) => {
    const resolvedSize = resolveOption(size, SELECT_SIZE_CLASS, SELECT_DEFAULTS.size);
    const resolvedVariant = resolveOption(variant, SELECT_VARIANT_CLASS, SELECT_DEFAULTS.variant);
    const resolvedStatus = resolveOption(status, SELECT_STATUS_CLASS, SELECT_DEFAULTS.status);
    return (
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          SELECT_TRIGGER_BASE_CLASS,
          SELECT_SIZE_CLASS[resolvedSize],
          SELECT_VARIANT_CLASS[resolvedVariant],
          SELECT_STATUS_CLASS[resolvedStatus],
          className
        )}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="text-muted h-[var(--size-icon-md)] w-[var(--size-icon-md)] shrink-0" />
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
      <SelectPrimitive.Viewport className="p-[var(--space-1)]">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "text-body-sm data-[highlighted]:bg-surface-elevated data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary data-[state=checked]:data-[highlighted]:bg-primary/15 relative flex h-9 w-full cursor-pointer select-none items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 leading-none outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="truncate">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />
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
  status = SELECT_DEFAULTS.status,
  errorMessage,
  className,
  style,
  contentClassName,
  contentStyle,
  maxVisibleItems = SELECT_DEFAULTS.maxVisibleItems
}: SelectProps<T>) {
  const rawStatus = errorMessage ? "error" : status;
  const resolvedSize = resolveOption(size, SELECT_SIZE_CLASS, SELECT_DEFAULTS.size);
  const resolvedVariant = resolveOption(variant, SELECT_VARIANT_CLASS, SELECT_DEFAULTS.variant);
  const activeStatus = resolveOption(rawStatus, SELECT_STATUS_CLASS, SELECT_DEFAULTS.status);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const triggerWidth = usePopoverTriggerWidth(triggerRef, open);
  const keyedOptions = useKeyedSelectOptions(options);
  const { optionByKey } = useSelectOptionMaps(options);
  const controlledSingleValue = React.useMemo(() => {
    if (Array.isArray(value) || value === undefined) {
      return undefined;
    }
    if (value === null) {
      return "";
    }
    return toSelectKey(value);
  }, [value]);
  const [selectedKey, setSelectedKey] = useControlledValue<string>({
    value: controlledSingleValue,
    defaultValue: ""
  });
  const filteredOptions = useFilteredSelectOptions(options, query, searchable);
  const filteredKeyedOptions = useKeyedSelectOptions(filteredOptions);
  const selectedOptionLabel = selectedKey ? optionByKey.get(selectedKey)?.label : null;
  const viewportStyle = React.useMemo(
    () => ({ maxHeight: resolveSelectViewportHeight(maxVisibleItems, SELECT_ROW_HEIGHT_PX) }),
    [maxVisibleItems]
  );
  const isDisabled = Boolean(disabled || loading);
  const triggerClassName = React.useMemo(
    () =>
      cn(
        SELECT_TRIGGER_BASE_CLASS,
        SELECT_SIZE_CLASS[resolvedSize],
        SELECT_VARIANT_CLASS[resolvedVariant],
        SELECT_STATUS_CLASS[activeStatus],
        className
      ),
    [activeStatus, className, resolvedSize, resolvedVariant]
  );
  const popoverContentStyle = React.useMemo(
    () => ({ width: triggerWidth || undefined, ...(contentStyle ?? {}) }),
    [contentStyle, triggerWidth]
  );

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
  }, []);

  const handleSearchableOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
    }
  }, []);

  const handleValueChange = React.useCallback(
    (nextValueString: string) => {
      const selectedOption = optionByKey.get(nextValueString);
      setSelectedKey(nextValueString);
      onChange?.(selectedOption ? selectedOption.value : (nextValueString as unknown as T));
    },
    [onChange, optionByKey, setSelectedKey]
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
        onOpenChange={handleSearchableOpenChange}
      >
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            disabled={isDisabled}
            className={triggerClassName}
            style={style}
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
            <ChevronDown className="text-muted ml-2 h-[var(--size-icon-md)] w-[var(--size-icon-md)] shrink-0" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={0}
            className={cn(SELECT_POPOVER_CONTENT_BASE_CLASS, contentClassName)}
            style={popoverContentStyle}
          >
            {loading ? (
              <div className="text-body-sm text-muted px-2 py-2">불러오는 중...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-body-sm text-muted px-2 py-2">{emptyMessage}</div>
            ) : (
              <div className={SELECT_SCROLL_LIST_CLASS} style={viewportStyle}>
                {filteredKeyedOptions.map(({ key, option }) => {
                  const checked = key === selectedKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={option.disabled}
                      className={cn(
                        "text-body-sm data-[highlighted]:bg-surface-elevated relative flex h-9 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 text-left disabled:cursor-not-allowed disabled:opacity-50",
                        checked
                          ? "bg-primary/10 text-primary hover:bg-primary/15 active:bg-primary/20"
                          : "text-foreground hover:bg-surface-elevated"
                      )}
                      onClick={() => {
                        handleValueChange(key);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="truncate">{option.label}</span>
                      {checked ? <Check className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" /> : null}
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
      <SelectTrigger size={resolvedSize} variant={resolvedVariant} status={activeStatus} className={className} style={style}>
        <span className="flex min-w-0 flex-1 items-center gap-[var(--space-1)]">
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent className={contentClassName} style={contentStyle}>
        {loading ? (
          <div className="text-body-sm text-muted px-2 py-2">불러오는 중...</div>
        ) : (
          <div
            className={SELECT_SCROLL_LIST_CLASS}
            style={{ maxHeight: resolveSelectViewportHeight(maxVisibleItems, SELECT_ROW_HEIGHT_PX) }}
          >
            {keyedOptions.map(({ key, option }) => (
              <SelectItem key={key} value={key} disabled={option.disabled}>
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
  status = SELECT_DEFAULTS.status,
  errorMessage,
  className,
  style,
  contentClassName,
  contentStyle,
  maxVisibleItems = SELECT_DEFAULTS.maxVisibleItems,
  maxTagCount = SELECT_DEFAULTS.maxTagCount
}: SelectProps<T>) {
  const rawStatus = errorMessage ? "error" : status;
  const resolvedSize = resolveOption(size, SELECT_SIZE_CLASS, SELECT_DEFAULTS.size);
  const resolvedVariant = resolveOption(variant, SELECT_VARIANT_CLASS, SELECT_DEFAULTS.variant);
  const activeStatus = resolveOption(rawStatus, SELECT_STATUS_CLASS, SELECT_DEFAULTS.status);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const triggerWidth = usePopoverTriggerWidth(triggerRef, open);
  const keyedOptions = useKeyedSelectOptions(options);
  const { labelByKey } = useSelectOptionMaps(options);
  const controlledMultipleValue = React.useMemo(() => {
    if (value === undefined) {
      return undefined;
    }
    return Array.isArray(value) ? value : [];
  }, [value]);
  const [selectedValues, setSelectedValues] = useControlledValue<T[]>({
    value: controlledMultipleValue,
    defaultValue: []
  });
  const selectedValuesByKey = React.useMemo(() => {
    const map = new Map<string, T>();
    for (const item of selectedValues) {
      map.set(toSelectKey(item), item);
    }
    return map;
  }, [selectedValues]);
  const selectedKeys = React.useMemo(() => selectedValues.map((item) => toSelectKey(item)), [selectedValues]);
  const selectedValueSet = React.useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const selectableOptions = React.useMemo(() => keyedOptions.filter(({ option }) => !option.disabled), [keyedOptions]);
  const selectableKeys = React.useMemo(() => selectableOptions.map(({ key }) => key), [selectableOptions]);
  const allSelectableValues = React.useMemo(() => selectableOptions.map(({ option }) => option.value as T), [selectableOptions]);
  const selectedSelectableCount = React.useMemo(
    () => selectableKeys.reduce((count, key) => count + (selectedValueSet.has(key) ? 1 : 0), 0),
    [selectableKeys, selectedValueSet]
  );
  const isAllSelected = selectableKeys.length > 0 && selectedSelectableCount === selectableKeys.length;
  const filteredOptions = useFilteredSelectOptions(options, query, searchable);
  const filteredKeyedOptions = useKeyedSelectOptions(filteredOptions);
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
  const triggerClassName = React.useMemo(
    () =>
      cn(
        SELECT_TRIGGER_BASE_CLASS,
        SELECT_SIZE_CLASS[resolvedSize],
        SELECT_VARIANT_CLASS[resolvedVariant],
        SELECT_STATUS_CLASS[activeStatus],
        "min-h-10 h-auto py-1.5",
        className
      ),
    [activeStatus, className, resolvedSize, resolvedVariant]
  );
  const popoverContentStyle = React.useMemo(
    () => ({ width: triggerWidth || undefined, ...(contentStyle ?? {}) }),
    [contentStyle, triggerWidth]
  );

  const handleQueryChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, []);

  const toggleValue = React.useCallback(
    (nextValue: T) => {
      const key = toSelectKey(nextValue);
      const nextMap = new Map(selectedValuesByKey);
      if (nextMap.has(key)) {
        nextMap.delete(key);
      } else {
        nextMap.set(key, nextValue);
      }
      const next = Array.from(nextMap.values());
      setSelectedValues(next);
      onChange?.(next as T[]);
    },
    [onChange, selectedValuesByKey, setSelectedValues]
  );

  const handleClear = React.useCallback(() => {
    setSelectedValues([]);
    onChange?.([]);
  }, [onChange, setSelectedValues]);

  const handleToggleAll = React.useCallback(() => {
    if (isAllSelected) {
      handleClear();
      return;
    }

    setSelectedValues(allSelectableValues);
    onChange?.(allSelectableValues);
  }, [allSelectableValues, handleClear, isAllSelected, onChange, setSelectedValues]);

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
          className={triggerClassName}
          style={style}
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
            <span className="flex min-w-0 flex-1 items-center gap-[var(--space-1-5)] overflow-hidden">
              {visibleTagKeys.map((key) => (
                <span
                  key={key}
                  className="bg-primary/10 text-primary inline-flex max-w-[var(--size-popover-sm)] shrink-0 items-center rounded-[var(--radius-sm)] px-[var(--space-2-5)] py-[var(--size-border-hairline)] text-[11px] font-medium"
                >
                  <span className="truncate">{labelByKey.get(key) ?? key}</span>
                </span>
              ))}
              {hiddenTagCount > 0 ? (
                <span className="bg-surface-elevated text-muted inline-flex shrink-0 items-center rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--size-border-hairline)] text-[11px] font-medium">
                  +{hiddenTagCount}
                </span>
              ) : null}
            </span>
          )}
          <ChevronDown className="text-muted ml-2 h-[var(--size-icon-md)] w-[var(--size-icon-md)] shrink-0" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={0}
          className={cn(SELECT_POPOVER_CONTENT_BASE_CLASS, contentClassName)}
          style={popoverContentStyle}
        >
          <button
            type="button"
            className="text-body-sm text-muted hover:bg-surface-elevated hover:text-foreground mb-[var(--space-1)] flex h-[var(--size-control-sm)] w-full items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-3)]"
            onClick={handleToggleAll}
          >
            <span>{isAllSelected ? "전체 해제" : "전체 선택"}</span>
            <span className="text-caption text-muted">{selectedSelectableCount}/{selectableKeys.length}</span>
          </button>

          {loading ? (
            <div className="text-body-sm text-muted px-[var(--space-2)] py-[var(--space-2)]">불러오는 중...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="text-body-sm text-muted px-2 py-2">{emptyMessage}</div>
          ) : (
            <div className={SELECT_SCROLL_LIST_CLASS} style={viewportStyle}>
              {filteredKeyedOptions.map(({ key, option }) => {
                const checked = selectedValueSet.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={option.disabled}
                    className={cn(
                      "text-body-sm flex h-9 w-full items-center gap-2 rounded-[var(--radius-md)] px-3 text-left disabled:cursor-not-allowed disabled:opacity-50",
                      checked
                        ? "bg-primary/10 text-primary hover:bg-primary/15 active:bg-primary/20"
                        : "text-foreground hover:bg-surface-elevated"
                    )}
                    onClick={() => toggleValue(option.value)}
                  >
                    <span
                      className={cn(
                        "border-default bg-surface flex h-[var(--size-icon-md)] w-[var(--size-icon-md)] items-center justify-center rounded-[var(--radius-sm)] border",
                        checked ? "border-primary/40 bg-primary/10" : null
                      )}
                    >
                      {checked ? <Check className="text-primary h-[var(--size-icon-sm)] w-[var(--size-icon-sm)]" /> : null}
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
