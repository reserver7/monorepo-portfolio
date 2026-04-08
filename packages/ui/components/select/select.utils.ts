import type * as React from "react";
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
