import * as React from "react";
import type { SelectOption } from "./select.types";

export const toSelectKey = (value: unknown) => String(value);

export const normalizeSelectKeyword = (input: string) => input.trim().toLowerCase();

export const getSelectOptionLabelText = (label: React.ReactNode): string => {
  if (typeof label === "string") {
    return label;
  }
  if (typeof label === "number") {
    return String(label);
  }
  return "";
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

export const filterSelectOptions = <T>(options: Array<SelectOption<T>>, query: string) => {
  const normalizedQuery = normalizeSelectKeyword(query);
  if (!normalizedQuery) {
    return options;
  }

  return options.filter((option) => {
    const label = normalizeSelectKeyword(getSelectOptionLabelText(option.label));
    const keywords = normalizeSelectKeyword(option.keywords ?? "");
    return label.includes(normalizedQuery) || keywords.includes(normalizedQuery);
  });
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

export const resolveSelectViewportHeight = (maxVisibleItems: number, rowHeightPx: number) => {
  return `${maxVisibleItems * rowHeightPx}px`;
};

export const buildMultiSelectLabel = (
  selectedKeys: string[],
  labelByKey: Map<string, string>,
  placeholder: string
) => {
  if (selectedKeys.length === 0) {
    return placeholder;
  }

  const labels = selectedKeys.map((key) => labelByKey.get(key) ?? "").filter(Boolean);
  return labels.length > 0 ? labels.join(", ") : `${selectedKeys.length}개 선택`;
};

export const usePopoverTriggerWidth = (
  triggerRef: React.RefObject<HTMLElement | null>,
  open: boolean
) => {
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    const target = triggerRef.current;
    if (!target || !open) {
      return;
    }

    const updateWidth = () => {
      setTriggerWidth(target.offsetWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(target);

    return () => observer.disconnect();
  }, [open, triggerRef]);

  return triggerWidth;
};
