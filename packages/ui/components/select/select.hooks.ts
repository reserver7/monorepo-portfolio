import * as React from "react";
import type { SelectOption } from "./select.types";
import { filterSelectOptions, getSelectOptionLabelText, toSelectKey } from "./select.utils";

export type KeyedSelectOption<T> = {
  key: string;
  option: SelectOption<T>;
};

export const useKeyedSelectOptions = <T>(options: Array<SelectOption<T>>): Array<KeyedSelectOption<T>> => {
  return React.useMemo(
    () =>
      options.map((option) => ({
        key: toSelectKey(option.value),
        option
      })),
    [options]
  );
};

export const useSelectOptionMaps = <T>(options: Array<SelectOption<T>>) => {
  return React.useMemo(() => {
    const optionByKey = new Map<string, SelectOption<T>>();
    const labelByKey = new Map<string, string>();

    for (const option of options) {
      const key = toSelectKey(option.value);
      optionByKey.set(key, option);
      labelByKey.set(key, getSelectOptionLabelText(option.label));
    }

    return { optionByKey, labelByKey };
  }, [options]);
};

export const useFilteredSelectOptions = <T>(
  options: Array<SelectOption<T>>,
  query: string,
  searchable: boolean
) => {
  const deferredQuery = React.useDeferredValue(query);

  return React.useMemo(() => {
    if (!searchable) {
      return options;
    }

    return filterSelectOptions(options, deferredQuery);
  }, [deferredQuery, options, searchable]);
};

export const usePopoverTriggerWidth = (triggerRef: React.RefObject<HTMLElement | null>, open: boolean) => {
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    const target = triggerRef.current;
    if (!target || !open) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = target.offsetWidth;
      setTriggerWidth((prevWidth) => (prevWidth === nextWidth ? prevWidth : nextWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(target);

    return () => observer.disconnect();
  }, [open, triggerRef]);

  return triggerWidth;
};
