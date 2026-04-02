"use client";

import * as React from "react";

export interface UseControlledValueOptions<T> {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}

export function useControlledValue<T>({
  value,
  defaultValue,
  onChange
}: UseControlledValueOptions<T>): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? (value as T) : uncontrolledValue;

  const setValue = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      if (isControlled) {
        const resolvedValue = typeof next === "function" ? (next as (prev: T) => T)(currentValue) : next;
        if (!Object.is(currentValue, resolvedValue)) {
          onChange?.(resolvedValue);
        }
        return;
      }

      setUncontrolledValue((prev) => {
        const resolvedValue = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        if (!Object.is(prev, resolvedValue)) {
          onChange?.(resolvedValue);
        }
        return resolvedValue;
      });
    },
    [currentValue, isControlled, onChange]
  );

  return [currentValue, setValue, isControlled];
}
