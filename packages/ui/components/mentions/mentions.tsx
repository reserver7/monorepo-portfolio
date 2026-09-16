"use client";

import * as React from "react";
import { useControlledValue } from "../../hooks";
import { cn } from "../cn";
import { useUiLocale } from "../ui-locale";
import { FieldSupportText, RequiredMark } from "../field/field-utils";
import { Label } from "../label";
import type { MentionOption, MentionsProps } from "./mentions.types";

export const Mentions = React.forwardRef<HTMLTextAreaElement, MentionsProps>(function Mentions(
  {
    value,
    defaultValue = "",
    onChange,
    onSearch,
    onSelect,
    options = [],
    prefix = "@",
    split = " ",
    status = "default",
    size = "md",
    variant = "default",
    loading = false,
    notFoundContent = "결과 없음",
    label,
    helperText,
    errorMessage,
    required,
    id,
    className,
    ...props
  },
  ref
) {
  const labels = useUiLocale();
  const [current, setCurrent] = useControlledValue({ value, defaultValue, onChange });
  const [active, setActive] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState(0);
  const prefixes = Array.isArray(prefix) ? prefix : [prefix];
  const token = current.slice(current.lastIndexOf(split) + split.length);
  const activePrefix = prefixes.find((item) => token.startsWith(item)) ?? "";
  const trigger = activePrefix.length > 0;
  const searchValue = trigger ? token.slice(activePrefix.length) : "";
  const filtered = options.filter((option) =>
    String(option.value).toLowerCase().includes(searchValue.toLowerCase())
  );
  React.useEffect(() => {
    if (trigger) onSearch?.(searchValue, activePrefix);
  }, [activePrefix, onSearch, searchValue, trigger]);
  const choose = (option: MentionOption) => {
    if (option.disabled) return;
    const separatorIndex = current.lastIndexOf(split);
    const prefixValue = current.slice(0, separatorIndex + split.length);
    const next = `${prefixValue}${activePrefix}${option.value}${split}`;
    setCurrent(next);
    setActive(false);
    onSelect?.(option);
  };
  const sizeClass = size === "sm" ? "min-h-20 text-sm" : size === "lg" ? "min-h-32" : "min-h-24";
  const statusClass =
    errorMessage || status === "error"
      ? "border-danger"
      : status === "warning"
        ? "border-warning"
        : "border-border";
  const resolvedId = id ?? `mentions-${React.useId()}`;
  const supportId = `${resolvedId}-support`;
  const listboxId = `${resolvedId}-listbox`;
  return (
    <div className="grid gap-1.5">
      {label ? (
        <Label htmlFor={resolvedId} size={size === "lg" ? "md" : "sm"} required={required}>
          {label}
        </Label>
      ) : required ? (
        <RequiredMark />
      ) : null}
      <div className="relative">
        <textarea
          ref={ref}
          id={resolvedId}
          value={current}
          required={required}
          aria-invalid={Boolean(errorMessage || status === "error")}
          aria-describedby={helperText || errorMessage ? supportId : undefined}
          aria-autocomplete="list"
          aria-controls={active && trigger ? listboxId : undefined}
          aria-expanded={active && trigger}
          onChange={(event) => {
            setCurrent(event.target.value);
            setActive(true);
            setHighlighted(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && filtered.length) {
              event.preventDefault();
              setActive(true);
              setHighlighted((index) => Math.min(index + 1, filtered.length - 1));
            }
            if (event.key === "ArrowUp" && filtered.length) {
              event.preventDefault();
              setHighlighted((index) => Math.max(index - 1, 0));
            }
            if (event.key === "Enter" && active && filtered[highlighted]) {
              event.preventDefault();
              choose(filtered[highlighted]);
            }
            if (event.key === "Escape") setActive(false);
          }}
          className={cn(
            "bg-surface text-foreground focus-visible:ring-primary w-full resize-y rounded-[var(--radius-md)] px-3 py-2 outline-none focus-visible:ring-1",
            sizeClass,
            statusClass,
            variant === "filled" && "bg-surface-elevated border-transparent",
            variant === "ghost" && "border-transparent bg-transparent",
            className
          )}
          {...props}
        />
        {active && trigger ? (
          <div
            id={listboxId}
            role="listbox"
            className="border-border bg-surface absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-[var(--radius-md)] border p-1 shadow-lg"
          >
            {loading ? (
              <p role="status" className="text-muted px-3 py-2 text-sm">
                {labels.loading}
              </p>
            ) : filtered.length ? (
              filtered.map((option, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlighted}
                  disabled={option.disabled}
                  key={option.value}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  className={cn(
                    "hover:bg-surface-elevated block w-full rounded px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50",
                    index === highlighted && "bg-surface-elevated"
                  )}
                >
                  {option.label ?? option.value}
                </button>
              ))
            ) : (
              <p className="text-muted px-3 py-2 text-sm">{notFoundContent}</p>
            )}
          </div>
        ) : null}
      </div>
      <FieldSupportText id={supportId} message={errorMessage ?? helperText} error={Boolean(errorMessage)} />
    </div>
  );
});
Mentions.displayName = "Mentions";
