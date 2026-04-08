import * as React from "react";
import type { CheckboxGroupState } from "./checkbox.types";

export function useCheckboxGroup<T>(items: T[], selected: T[], onChange: (next: T[]) => void): CheckboxGroupState<T> {
  const selectedSet = React.useMemo(() => new Set(selected), [selected]);
  const totalCount = items.length;
  const selectedCount = items.filter((item) => selectedSet.has(item)).length;

  const allChecked = totalCount > 0 && selectedCount === totalCount;
  const indeterminate = selectedCount > 0 && selectedCount < totalCount;

  const isChecked = React.useCallback((item: T) => selectedSet.has(item), [selectedSet]);

  const toggleOne = React.useCallback(
    (item: T) => {
      if (selectedSet.has(item)) {
        onChange(selected.filter((value) => value !== item));
        return;
      }
      onChange([...selected, item]);
    },
    [onChange, selected, selectedSet]
  );

  const toggleAll = React.useCallback(() => {
    onChange(allChecked ? [] : [...items]);
  }, [allChecked, items, onChange]);

  return {
    allChecked,
    indeterminate,
    selectedCount,
    totalCount,
    isChecked,
    toggleOne,
    toggleAll
  };
}
