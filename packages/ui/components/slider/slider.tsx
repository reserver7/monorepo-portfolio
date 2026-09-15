"use client";

import * as React from "react";
import { cn } from "../cn";
import type { SliderProps, SliderValue } from "./slider.types";

export function Slider({
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onChangeComplete,
  range = false,
  disabled = false,
  reverse = false,
  tooltip = false,
  marks,
  className,
  ...props
}: SliderProps) {
  const initial: SliderValue = range
    ? Array.isArray(defaultValue)
      ? defaultValue
      : [min, defaultValue]
    : Array.isArray(defaultValue)
      ? (defaultValue[0] ?? min)
      : defaultValue;
  const [uncontrolled, setUncontrolled] = React.useState<SliderValue>(initial);
  const current = value ?? uncontrolled;
  const values: [number, number] = range
    ? Array.isArray(current)
      ? current
      : [min, current]
    : [
        Array.isArray(current) ? (current[0] ?? min) : current,
        Array.isArray(current) ? (current[0] ?? min) : current
      ];
  const percent = (numberValue: number) => (max === min ? 0 : ((numberValue - min) / (max - min)) * 100);
  const update = (index: number, nextValue: number) => {
    const nextValues: [number, number] = [...values];
    nextValues[index] = Math.min(max, Math.max(min, nextValue));
    if (range && nextValues[0] > nextValues[1])
      [nextValues[0], nextValues[1]] = [nextValues[1], nextValues[0]];
    const next: SliderValue = range ? nextValues : nextValues[0];
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };
  const input = (index: 0 | 1) => (
    <input
      aria-label={range ? (index === 0 ? "Minimum" : "Maximum") : "Value"}
      type="range"
      min={min}
      max={max}
      step={step ?? "any"}
      value={values[index]}
      disabled={disabled}
      onChange={(event) => update(index, Number(event.target.value))}
      onMouseUp={() => onChangeComplete?.(value ?? uncontrolled)}
      onKeyUp={() => onChangeComplete?.(value ?? uncontrolled)}
      className={cn(
        "accent-primary absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50",
        reverse && "[direction:rtl]"
      )}
    />
  );
  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="relative h-6">
        <div className="bg-surface-muted absolute top-2 h-2 w-full rounded-full" />
        <div
          className="bg-primary absolute top-2 h-2 rounded-full"
          style={{ left: `${percent(values[0])}%`, right: `${100 - percent(values[range ? 1 : 0])}%` }}
        />
        {range ? (
          <>
            {input(0)}
            {input(1)}
          </>
        ) : (
          input(0)
        )}
        {tooltip ? (
          <span
            className="text-text-secondary absolute -top-5 -translate-x-1/2 text-xs"
            style={{ left: `${percent(values[range ? 1 : 0])}%` }}
          >
            {values[range ? 1 : 0]}
          </span>
        ) : null}
      </div>
      {marks ? (
        <div className="text-text-tertiary relative h-6 text-xs">
          {Object.entries(marks).map(([mark, label]) => (
            <span
              key={mark}
              className="absolute -translate-x-1/2"
              style={{ left: `${percent(Number(mark))}%` }}
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
