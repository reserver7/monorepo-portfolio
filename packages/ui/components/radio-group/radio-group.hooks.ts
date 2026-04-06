import * as React from "react";
import type { RadioOption } from "./radio-group.types";

export function useRadioOptionMap(options: RadioOption[]) {
  return React.useMemo(() => {
    const map = new Map<string, RadioOption>();
    for (const option of options) {
      map.set(option.value, option);
    }
    return map;
  }, [options]);
}
