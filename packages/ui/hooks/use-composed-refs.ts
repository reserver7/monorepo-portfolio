"use client";

import * as React from "react";

export function useComposedRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return React.useCallback((node: T | null) => {
    for (const ref of refs) {
      if (!ref) {
        continue;
      }

      if (typeof ref === "function") {
        ref(node);
        continue;
      }

      (ref as React.MutableRefObject<T | null>).current = node;
    }
  }, refs);
}
