import type * as React from "react";
import { DayPicker, type Matcher } from "react-day-picker";

type DayPickerProps = React.ComponentProps<typeof DayPicker>;

export const toMatcherArray = (disabled: DayPickerProps["disabled"]): Matcher[] => {
  if (!disabled) return [];
  return Array.isArray(disabled) ? (disabled as Matcher[]) : [disabled as Matcher];
};
