import * as React from "react";
import { DayPicker } from "react-day-picker";

export type CalendarSize = "sm" | "md" | "lg";
export type CalendarDensity = "comfortable" | "compact";
export type CalendarVariant = "default" | "elevated";
export type CalendarWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type CalendarMode = "single" | "multiple" | "range";

export type CalendarProps = Omit<React.ComponentProps<typeof DayPicker>, "mode" | "selected" | "onSelect"> & {
  mode?: CalendarMode;
  selected?: unknown;
  onSelect?: (value: unknown) => void;
  size?: CalendarSize;
  density?: CalendarDensity;
  variant?: CalendarVariant;
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  disableFuture?: boolean;
  disableWeekends?: boolean;
  disableWeekdays?: CalendarWeekday[];
  withMonthYearPicker?: boolean;
};
