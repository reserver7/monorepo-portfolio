"use client";

import * as React from "react";
import { useControlledValue } from "../../hooks";
import { cn } from "../cn";
import type { AutoCompleteOption, AutoCompleteProps } from "./auto-complete.types";

export const AutoComplete = React.forwardRef<HTMLInputElement, AutoCompleteProps>(function AutoComplete(
  {
    options = [],
    value,
    defaultValue = "",
    onChange,
    onSearch,
    onSelect,
    onClear,
    open,
    defaultOpen = false,
    onOpenChange,
    allowClear = false,
    filterOption = true,
    notFoundContent = "No results",
    loading = false,
    size = "md",
    variant = "default",
    status = "default",
    className,
    disabled,
    readOnly,
    id,
    onKeyDown,
    ...props
  },
  ref
) {
  const [current, setCurrent] = useControlledValue({ value, defaultValue, onChange });
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [highlighted, setHighlighted] = React.useState(0);
  const isOpen = open ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const filtered = options.filter((option) =>
    option.disabled
      ? false
      : filterOption === false
        ? true
        : typeof filterOption === "function"
          ? filterOption(current, option)
          : option.value.toLowerCase().includes(current.toLowerCase())
  );
  const select = (option: AutoCompleteOption) => {
    setCurrent(option.value);
    onSelect?.(option.value, option);
    setOpen(false);
  };
  const sizeClass = size === "sm" ? "h-8 text-sm" : size === "lg" ? "h-12" : "h-10";
  const statusClass =
    status === "error" ? "border-danger" : status === "warning" ? "border-warning" : "border-border";
  return (
    <div className="relative w-full">
      <div
        className={cn(
          "bg-surface focus-within:ring-primary flex items-center rounded-[var(--radius-md)] border transition-colors focus-within:ring-1",
          sizeClass,
          statusClass,
          variant === "filled" && "bg-surface-elevated border-transparent",
          variant === "ghost" && "border-transparent bg-transparent",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          readOnly={readOnly}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? `${id ?? "auto-complete"}-listbox` : undefined}
          aria-autocomplete="list"
          aria-invalid={status === "error" || undefined}
          value={current}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setCurrent(event.target.value);
            onSearch?.(event.target.value);
            setHighlighted(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            if (event.key === "ArrowDown" && filtered.length) {
              event.preventDefault();
              setOpen(true);
              setHighlighted((index) => Math.min(index + 1, filtered.length - 1));
            }
            if (event.key === "ArrowUp" && filtered.length) {
              event.preventDefault();
              setHighlighted((index) => Math.max(index - 1, 0));
            }
            if (event.key === "Enter" && isOpen && filtered[highlighted]) {
              event.preventDefault();
              select(filtered[highlighted]);
            }
            if (event.key === "Escape") setOpen(false);
          }}
          className={cn(
            "text-foreground placeholder:text-muted min-w-0 flex-1 bg-transparent px-3 outline-none",
            className
          )}
          {...props}
        />
        {allowClear && current ? (
          <button
            type="button"
            aria-label="Clear"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setCurrent("");
              onSearch?.("");
              onClear?.();
            }}
            className="text-muted focus-visible:ring-primary rounded-sm px-2 focus-visible:outline-none focus-visible:ring-2"
          >
            ×
          </button>
        ) : null}
        {loading ? (
          <span role="status" aria-live="polite" aria-label="Loading" className="text-muted px-3">
            …
          </span>
        ) : null}
      </div>
      {isOpen ? (
        <div
          id={`${id ?? "auto-complete"}-listbox`}
          role="listbox"
          className="border-border bg-surface absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[var(--radius-md)] border p-1"
        >
          {filtered.length ? (
            filtered.map((option, index) => (
              <button
                type="button"
                role="option"
                aria-selected={index === highlighted}
                key={option.value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(option)}
                className={cn(
                  "hover:bg-surface-elevated focus-visible:ring-primary block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2",
                  index === highlighted && "bg-surface-elevated"
                )}
              >
                {option.label ?? option.value}
              </button>
            ))
          ) : (
            <div className="text-muted px-3 py-2 text-sm">{notFoundContent}</div>
          )}
        </div>
      ) : null}
    </div>
  );
});
AutoComplete.displayName = "AutoComplete";
