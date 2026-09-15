"use client";

import * as React from "react";
import { useControlledValue } from "../../hooks";
import { cn } from "../cn";
import type { InputNumberProps, InputNumberValue } from "./input-number.types";

const toInput = (value: InputNumberValue) => (value == null ? "" : String(value));
const toNumber = (value: string) =>
  value.trim() === "" || Number.isNaN(Number(value)) ? null : Number(value);
const clamp = (value: number, min?: number, max?: number) =>
  Math.min(max ?? value, Math.max(min ?? value, value));
const round = (value: number, precision?: number) =>
  precision == null ? value : Number(value.toFixed(precision));

export const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(function InputNumber(
  {
    className,
    value,
    defaultValue = null,
    onChange,
    onStep,
    min,
    max,
    step = 1,
    precision,
    stringMode = false,
    controls = true,
    keyboard = true,
    changeOnWheel = false,
    formatter,
    parser,
    size = "md",
    variant = "default",
    status = "default",
    prefix,
    suffix,
    addonBefore,
    addonAfter,
    disabled,
    readOnly,
    id,
    name,
    onKeyDown,
    onWheel,
    ...props
  },
  ref
) {
  const [current, setCurrent] = useControlledValue<InputNumberValue>({ value, defaultValue, onChange });
  const [input, setInput] = React.useState(() => toInput(current));
  const lastValue = React.useRef(current);
  React.useEffect(() => {
    if (!Object.is(lastValue.current, current)) {
      setInput(toInput(current));
      lastValue.current = current;
    }
  }, [current]);
  const emit = (nextInput: string) => {
    const parsed = parser ? parser(nextInput) : nextInput;
    if (parsed.trim() === "") {
      setInput("");
      setCurrent(null);
      return;
    }
    const numeric = toNumber(parsed);
    if (numeric == null) {
      setInput(nextInput);
      return;
    }
    const next = round(clamp(numeric, min, max), precision);
    const output: InputNumberValue = stringMode ? String(next) : next;
    setInput(formatter ? formatter(output, { userTyping: true, input: nextInput }) : String(output));
    setCurrent(output);
  };
  const increment = (direction: 1 | -1) => {
    const currentNumber = toNumber(parser ? parser(input) : input) ?? 0;
    const nextNumber = round(clamp(currentNumber + Number(step) * direction, min, max), precision);
    const output: InputNumberValue = stringMode ? String(nextNumber) : nextNumber;
    emit(String(nextNumber));
    onStep?.(output, { offset: Number(step), type: direction === 1 ? "up" : "down" });
  };
  const sizeClass = size === "sm" ? "h-8 text-sm" : size === "lg" ? "h-12" : "h-10";
  const variantClass =
    variant === "filled"
      ? "border-transparent bg-surface-elevated"
      : variant === "ghost"
        ? "border-transparent bg-transparent"
        : "border-border bg-surface";
  const statusClass =
    status === "error"
      ? "border-danger focus-within:ring-danger"
      : status === "warning"
        ? "border-warning focus-within:ring-warning"
        : "focus-within:ring-primary";
  const inputElement = (
    <input
      ref={ref}
      id={id}
      name={name}
      role="spinbutton"
      inputMode="decimal"
      disabled={disabled}
      readOnly={readOnly}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={typeof current === "number" ? current : undefined}
      aria-invalid={status === "error" || undefined}
      value={input}
      onChange={(event) => emit(event.target.value)}
      onBlur={() => {
        const parsed = parser ? parser(input) : input;
        const numeric = toNumber(parsed);
        if (numeric != null) emit(String(round(clamp(numeric, min, max), precision)));
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!keyboard || event.defaultPrevented || readOnly || disabled) return;
        if (event.key === "ArrowUp") {
          event.preventDefault();
          increment(1);
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          increment(-1);
        }
      }}
      onWheel={(event) => {
        onWheel?.(event);
        if (changeOnWheel && !event.defaultPrevented && !readOnly && !disabled) {
          event.preventDefault();
          increment(event.deltaY < 0 ? 1 : -1);
        }
      }}
      className={cn(
        "text-foreground placeholder:text-muted min-w-0 flex-1 bg-transparent px-3 text-right outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
  return (
    <div
      className={cn(
        "flex w-full items-center overflow-hidden rounded-[var(--radius-md)] border transition-colors focus-within:ring-1",
        sizeClass,
        variantClass,
        statusClass,
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span className="text-muted shrink-0">{addonBefore}</span>
      {prefix ? <span className="text-muted shrink-0 pl-3">{prefix}</span> : null}
      {inputElement}
      {suffix ? <span className="text-muted shrink-0 pr-3">{suffix}</span> : null}
      {controls ? (
        <span className="border-border flex h-full shrink-0 flex-col border-l">
          <button
            type="button"
            aria-label="Increase value"
            tabIndex={-1}
            disabled={disabled || readOnly || (max != null && Number(current) >= max)}
            onClick={() => increment(1)}
            className="text-muted hover:bg-surface-elevated flex min-w-7 flex-1 items-center justify-center text-xs disabled:opacity-40"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Decrease value"
            tabIndex={-1}
            disabled={disabled || readOnly || (min != null && Number(current) <= min)}
            onClick={() => increment(-1)}
            className="border-border text-muted hover:bg-surface-elevated flex min-w-7 flex-1 items-center justify-center border-t text-xs disabled:opacity-40"
          >
            −
          </button>
        </span>
      ) : null}
      <span className="text-muted shrink-0">{addonAfter}</span>
    </div>
  );
});
InputNumber.displayName = "InputNumber";
