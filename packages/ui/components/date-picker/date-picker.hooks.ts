import type { DateRangeStringValue, DateRangeValue, DateValue } from "./date-picker.types";

const pad2 = (value: number) => String(value).padStart(2, "0");

export const formatDateInputValue = (value: Date) =>
  `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;

export const toDateInputValue = (value: DateValue | undefined): string | undefined => {
  if (value == null) return undefined;
  if (value instanceof Date) return formatDateInputValue(value);
  return value;
};

export const parseDateValue = (value: DateValue | undefined): Date | undefined => {
  if (value == null) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value !== "string") return undefined;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  const parsedDate = new Date(year, month - 1, day);
  if (Number.isNaN(parsedDate.getTime())) return undefined;
  return parsedDate;
};

export const formatDateText = (date: Date, locale = "ko-KR") =>
  new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);

export const toDateRangeValue = (range: DateRangeValue | undefined): DateRangeStringValue => {
  if (!range) return {};
  return {
    from: toDateInputValue(range.from),
    to: toDateInputValue(range.to)
  };
};
