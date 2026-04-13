import { cn } from "../cn";
import { buttonVariants } from "../button";
import type { CalendarDensity, CalendarSize, CalendarVariant } from "./calendar.types";

export const CALENDAR_DEFAULTS = {
  showOutsideDays: false,
  numberOfMonths: 1,
  fixedWeeks: false,
  pagedNavigation: true,
  size: "md",
  density: "comfortable",
  variant: "default",
  disablePast: false,
  disableFuture: false,
  disableWeekends: false,
  withMonthYearPicker: false
} as const;

export const CALENDAR_BASE_CLASS = "rounded-[var(--radius-lg)]";

export const CALENDAR_VARIANT_CLASS: Record<CalendarVariant, string> = {
  default: "bg-surface",
  elevated: "border border-default bg-surface-elevated shadow-card"
};

export const CALENDAR_WRAPPER_PADDING_CLASS: Record<CalendarDensity, string> = {
  comfortable: "p-3",
  compact: "p-2"
};

export const CALENDAR_GAP_CLASS: Record<CalendarDensity, { months: string; month: string; row: string }> = {
  comfortable: { months: "gap-4", month: "space-y-3", row: "mt-1" },
  compact: { months: "gap-3", month: "space-y-2", row: "mt-0.5" }
};

export const CALENDAR_SIZE_CLASS: Record<CalendarSize, { headCell: string; cell: string; day: string; navButton: string }> =
  {
    sm: {
      headCell: "w-8 text-[11px]",
      cell: "h-8 w-8",
      day: "h-8 w-8 text-caption",
      navButton: "h-7 w-7"
    },
    md: {
      headCell: "w-9 text-caption",
      cell: "h-9 w-9",
      day: "h-9 w-9 text-body-sm",
      navButton: "h-8 w-8"
    },
    lg: {
      headCell: "w-10 text-body-sm",
      cell: "h-10 w-10",
      day: "h-10 w-10 text-body-md",
      navButton: "h-9 w-9"
    }
  };

export const createCalendarClassNames = (size: CalendarSize, density: CalendarDensity) => {
  const sizeClass = CALENDAR_SIZE_CLASS[size];
  const gapClass = CALENDAR_GAP_CLASS[density];

  return {
    months: cn("inline-flex flex-col", gapClass.months),
    month: cn("mx-auto w-fit", gapClass.month),
    caption: "relative flex items-center justify-center pt-1",
    caption_label: "text-body-md font-semibold",
    nav: "flex items-center gap-1",
    nav_button: cn(
      buttonVariants({ variant: "ghost", size: "sm" }),
      sizeClass.navButton,
      "rounded-[var(--radius-md)] p-0 text-muted hover:text-foreground"
    ),
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-fit border-collapse",
    head_row: "flex",
    head_cell: cn("text-muted text-center font-medium", sizeClass.headCell),
    row: cn("flex", gapClass.row),
    cell: cn("relative p-0 text-center", sizeClass.cell),
    day: cn(
      "rounded-[var(--radius-md)] border border-transparent p-0 font-medium text-foreground transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      sizeClass.day
    ),
    day_selected: "bg-primary text-primary-foreground hover:bg-primary/95",
    day_today: "border-primary/40 text-foreground",
    day_outside: "text-muted opacity-50",
    day_disabled: "text-muted opacity-50",
    day_range_start: "rounded-r-none",
    day_range_end: "rounded-l-none",
    day_range_middle: "aria-selected:bg-primary/15 aria-selected:text-foreground",
    day_hidden: "invisible"
  } as const;
};
