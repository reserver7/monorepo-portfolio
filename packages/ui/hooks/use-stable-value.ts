"use client";

import { useRef } from "react";

export function useStableValue<T>(factory: () => T): T {
  const valueRef = useRef<{ value: T } | null>(null);

  if (!valueRef.current) {
    valueRef.current = { value: factory() };
  }

  return valueRef.current.value;
}

