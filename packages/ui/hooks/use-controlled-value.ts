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
  const isControlledRef = React.useRef(isControlled);
  const currentValueRef = React.useRef(currentValue);
  const onChangeRef = React.useRef(onChange);

  React.useEffect(() => {
    isControlledRef.current = isControlled;
  }, [isControlled]);

  React.useEffect(() => {
    currentValueRef.current = currentValue;
  }, [currentValue]);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const setValue = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      if (isControlledRef.current) {
        const baseValue = currentValueRef.current;
        const resolvedValue = typeof next === "function" ? (next as (prev: T) => T)(baseValue) : next;
        if (!Object.is(baseValue, resolvedValue)) {
          onChangeRef.current?.(resolvedValue);
        }
        return;
      }

      setUncontrolledValue((prev) => {
        const resolvedValue = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        if (!Object.is(prev, resolvedValue)) {
          onChangeRef.current?.(resolvedValue);
        }
        return resolvedValue;
      });
    },
    []
  );

  return [currentValue, setValue, isControlled];
}
