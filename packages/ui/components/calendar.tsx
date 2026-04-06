"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./cn";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "space-y-3",
        caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-body-md font-semibold",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-8 w-8 rounded-md p-0 text-muted hover:text-foreground"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell: "text-muted w-9 text-center text-caption font-medium",
        row: "mt-1 flex w-full",
        cell: "relative h-9 w-9 p-0 text-center text-sm",
        day: "h-9 w-9 rounded-md border border-transparent p-0 text-body-sm font-medium text-foreground transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary/95",
        day_today: "border-default bg-surface-elevated text-foreground",
        day_outside: "text-muted opacity-50",
        day_disabled: "text-muted opacity-50",
        day_range_middle: "aria-selected:bg-primary/15 aria-selected:text-foreground",
        day_hidden: "invisible",
        ...classNames
      }}
      components={{
        IconLeft: (iconProps) => <ChevronLeft className="h-4 w-4" {...iconProps} />,
        IconRight: (iconProps) => <ChevronRight className="h-4 w-4" {...iconProps} />
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
