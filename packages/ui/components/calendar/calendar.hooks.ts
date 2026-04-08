import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarWeekday } from "./calendar.types";
import { toMatcherArray } from "./calendar.utils";

type DayPickerProps = React.ComponentProps<typeof DayPicker>;
type DayPickerIconComponent = NonNullable<NonNullable<DayPickerProps["components"]>["IconLeft"]>;
type DayPickerIconProps = DayPickerIconComponent extends (props: infer P) => unknown
  ? P
  : React.ComponentProps<typeof ChevronLeft>;

export const useMergedDisabledMatchers = ({
  disabled,
  disablePast,
  disableFuture,
  disableWeekends,
  disableWeekdays
}: {
  disabled: DayPickerProps["disabled"];
  disablePast: boolean;
  disableFuture: boolean;
  disableWeekends: boolean;
  disableWeekdays?: CalendarWeekday[];
}) =>
  React.useMemo(() => {
    const matchers = toMatcherArray(disabled);
    const today = new Date();
    const dayFloor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (disablePast) {
      matchers.push({ before: dayFloor });
    }
    if (disableFuture) {
      matchers.push({ after: dayFloor });
    }
    if (disableWeekends) {
      matchers.push({ dayOfWeek: [0, 6] });
    }
    if (disableWeekdays && disableWeekdays.length > 0) {
      matchers.push({ dayOfWeek: disableWeekdays });
    }

    return matchers.length > 0 ? matchers : undefined;
  }, [disableFuture, disablePast, disableWeekdays, disableWeekends, disabled]);

export const useCalendarChevronComponents = (components: DayPickerProps["components"]) =>
  React.useMemo(
    () => ({
      IconLeft: (iconProps: DayPickerIconProps) =>
        React.createElement(ChevronLeft, { className: "h-4 w-4", ...(iconProps as object) }),
      IconRight: (iconProps: DayPickerIconProps) =>
        React.createElement(ChevronRight, { className: "h-4 w-4", ...(iconProps as object) }),
      ...components
    }),
    [components]
  );
