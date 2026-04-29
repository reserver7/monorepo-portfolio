"use client";

import * as React from "react";

export function useComposedRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  const refsRef = React.useRef(refs);

  React.useEffect(() => {
    refsRef.current = refs;
  }, [refs]);

  return React.useCallback((node: T | null) => {
    for (const ref of refsRef.current) {
      if (!ref) {
        continue;
      }

      if (typeof ref === "function") {
        ref(node);
        continue;
      }

      (ref as React.MutableRefObject<T | null>).current = node;
    }
  }, []);
}
