"use client";

import * as React from "react";
import { useControlledValue } from "../../hooks";
import { cn } from "../cn";
import type { CascaderOption, CascaderProps } from "./cascader.types";

const findPath = (options: readonly CascaderOption[], path: string[]): CascaderOption[] => {
  const result: CascaderOption[] = [];
  let level = options;
  for (const value of path) {
    const option = level.find((item) => item.value === value);
    if (!option) break;
    result.push(option);
    level = option.children ?? [];
  }
  return result;
};

export const Cascader = React.forwardRef<HTMLButtonElement, CascaderProps>(function Cascader(
  {
    options,
    value,
    defaultValue = [],
    onChange,
    open,
    defaultOpen = false,
    onOpenChange,
    onClear,
    allowClear = false,
    showSearch = false,
    multiple = false,
    placeholder = "Select…",
    size = "md",
    variant = "default",
    status = "default",
    className,
    disabled,
    ...props
  },
  ref
) {
  const [current, setCurrent] = useControlledValue<string[]>({
    value,
    defaultValue,
    onChange: (next) => onChange?.(next, findPath(options, next))
  });
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [path, setPath] = React.useState<string[]>(current);
  const [query, setQuery] = React.useState("");
  const [highlighted, setHighlighted] = React.useState(0);
  const isOpen = open ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const selectedPath = findPath(options, current);
  const levelOptions = path.length ? (findPath(options, path).at(-1)?.children ?? []) : options;
  const visibleOptions =
    showSearch && query
      ? levelOptions.filter((item) => String(item.label).toLowerCase().includes(query.toLowerCase()))
      : levelOptions;
  React.useEffect(() => setHighlighted(0), [path, query]);
  const select = (option: CascaderOption) => {
    const nextPath = [...path, option.value];
    if (option.children?.length) {
      setPath(nextPath);
      return;
    }
    const next = multiple
      ? current.some((item) => item === nextPath.at(-1))
        ? current.filter((item) => item !== nextPath.at(-1))
        : [...current, nextPath.at(-1)!]
      : nextPath;
    setCurrent(next);
    if (!multiple) setOpen(false);
  };
  const sizeClass = size === "sm" ? "h-8 text-sm" : size === "lg" ? "h-12" : "h-10";
  const statusClass =
    status === "error" ? "border-danger" : status === "warning" ? "border-warning" : "border-border";
  const label = multiple ? `${current.length} selected` : selectedPath.map((item) => item.label).join(" / ");
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === "ArrowLeft" && path.length) {
      event.preventDefault();
      setPath(path.slice(0, -1));
      return;
    }
    if (!visibleOptions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => Math.min(visibleOptions.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => Math.max(0, index - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setHighlighted(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setHighlighted(visibleOptions.length - 1);
    } else if (event.key === "ArrowRight" && visibleOptions[highlighted]?.children?.length) {
      event.preventDefault();
      select(visibleOptions[highlighted]!);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(visibleOptions[highlighted]!);
    } else if (event.key === "Backspace" && !query && path.length) {
      event.preventDefault();
      setPath(path.slice(0, -1));
    }
  };
  return (
    <div className="relative w-full">
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "bg-surface focus-visible:ring-primary flex w-full items-center justify-between rounded-[var(--radius-md)] border px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2",
          sizeClass,
          statusClass,
          variant === "filled" && "bg-surface-elevated border-transparent",
          variant === "ghost" && "border-transparent bg-transparent",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          else if (event.key === "ArrowDown" && !isOpen) {
            event.preventDefault();
            setPath(current);
            setOpen(true);
          }
        }}
        onClick={() => {
          setPath(current);
          setOpen(!isOpen);
        }}
        {...props}
      >
        <span className={cn("min-w-0 truncate", !label && "text-muted")}>{label || placeholder}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {allowClear && current.length ? (
        <button
          type="button"
          aria-label="Clear"
          onClick={() => {
            setCurrent([]);
            onClear?.();
          }}
          className="text-muted focus-visible:ring-primary absolute right-8 top-1/2 -translate-y-1/2 rounded-sm focus-visible:outline-none focus-visible:ring-2"
        >
          ×
        </button>
      ) : null}
      {isOpen ? (
        <div
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="border-border bg-surface absolute z-50 mt-1 min-w-full rounded-[var(--radius-md)] border p-1 shadow-lg"
        >
          {showSearch ? (
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                event.stopPropagation();
                handleKeyDown(event);
              }}
              placeholder="Search…"
              className="border-border focus-visible:ring-primary mb-1 h-8 w-full rounded border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
            />
          ) : null}
          {path.length ? (
            <button
              type="button"
              onClick={() => setPath(path.slice(0, -1))}
              className="text-muted focus-visible:ring-primary block w-full rounded px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2"
            >
              ‹ Back
            </button>
          ) : null}
          {visibleOptions.map((option, index) => (
            <button
              type="button"
              role="option"
              key={option.value}
              disabled={option.disabled}
              aria-selected={current.includes(option.value)}
              className={cn(
                "hover:bg-surface-elevated focus-visible:ring-primary flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40",
                index === highlighted && "bg-surface-elevated"
              )}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => select(option)}
            >
              {option.label}
              <span aria-hidden="true">
                {option.children?.length ? "›" : current.includes(option.value) ? "✓" : ""}
              </span>
            </button>
          ))}
          {!visibleOptions.length ? <p className="text-muted px-3 py-2 text-sm">No results</p> : null}
        </div>
      ) : null}
    </div>
  );
});
Cascader.displayName = "Cascader";
