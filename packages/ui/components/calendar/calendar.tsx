"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "../cn";
import {
  CALENDAR_BASE_CLASS,
  CALENDAR_DEFAULTS,
  CALENDAR_VARIANT_CLASS,
  CALENDAR_WRAPPER_PADDING_CLASS,
  createCalendarClassNames
} from "./calendar.constants";
import { useCalendarChevronComponents, useMergedDisabledMatchers } from "./calendar.hooks";
import type { CalendarProps } from "./calendar.types";

const CalendarComponent = ({
  className,
  classNames,
  mode = "single",
  showOutsideDays = CALENDAR_DEFAULTS.showOutsideDays,
  numberOfMonths = CALENDAR_DEFAULTS.numberOfMonths,
  fixedWeeks = CALENDAR_DEFAULTS.fixedWeeks,
  pagedNavigation = CALENDAR_DEFAULTS.pagedNavigation,
  size = CALENDAR_DEFAULTS.size,
  density = CALENDAR_DEFAULTS.density,
  variant = CALENDAR_DEFAULTS.variant,
  minDate,
  maxDate,
  disablePast = CALENDAR_DEFAULTS.disablePast,
  disableFuture = CALENDAR_DEFAULTS.disableFuture,
  disableWeekends = CALENDAR_DEFAULTS.disableWeekends,
  disableWeekdays,
  withMonthYearPicker = CALENDAR_DEFAULTS.withMonthYearPicker,
  showWeekNumber = false,
  weekStartsOn = 0,
  captionLayout,
  fromYear,
  toYear,
  disabled,
  fromDate,
  toDate,
  components,
  selected,
  onSelect,
  ...props
}: CalendarProps) => {
  const mergedDisabled = useMergedDisabledMatchers({
    disabled,
    disablePast,
    disableFuture,
    disableWeekends,
    disableWeekdays
  });
  const mergedComponents = useCalendarChevronComponents(components);
  const calendarClassNames = React.useMemo(() => createCalendarClassNames(size, density), [density, size]);
  const mergedClassNames = React.useMemo(
    () => ({
      ...calendarClassNames,
      ...classNames
    }),
    [calendarClassNames, classNames]
  );
  const resolvedCaptionLayout = withMonthYearPicker ? (captionLayout ?? "dropdown-buttons") : captionLayout;
  const thisYear = new Date().getFullYear();
  const resolvedFromYear = resolvedCaptionLayout ? (fromYear ?? thisYear - 10) : fromYear;
  const resolvedToYear = resolvedCaptionLayout ? (toYear ?? thisYear + 10) : toYear;

  return (
    <DayPicker
      mode={mode as never}
      showOutsideDays={showOutsideDays}
      numberOfMonths={numberOfMonths}
      fixedWeeks={fixedWeeks}
      pagedNavigation={pagedNavigation}
      showWeekNumber={showWeekNumber}
      weekStartsOn={weekStartsOn}
      captionLayout={resolvedCaptionLayout}
      fromYear={resolvedFromYear}
      toYear={resolvedToYear}
      fromDate={minDate ?? fromDate}
      toDate={maxDate ?? toDate}
      disabled={mergedDisabled}
      selected={selected as never}
      onSelect={onSelect as never}
      className={cn(
        CALENDAR_BASE_CLASS,
        CALENDAR_VARIANT_CLASS[variant],
        CALENDAR_WRAPPER_PADDING_CLASS[density],
        className
      )}
      classNames={mergedClassNames}
      components={mergedComponents}
      {...props}
    />
  );
};

export const Calendar = React.memo(CalendarComponent);
Calendar.displayName = "Calendar";
