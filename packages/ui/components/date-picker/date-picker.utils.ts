import type { DateRangeStringValue, DateRangeValue, DateValue } from "./date-picker.types";

const pad2 = (value: number) => String(value).padStart(2, "0");

export const formatDateInputValue = (value: Date) =>
  `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;

export const formatTimeInputValue = (value: Date, showSeconds = false) => {
  const base = `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
  return showSeconds ? `${base}:${pad2(value.getSeconds())}` : base;
};

export const formatDateTimeInputValue = (value: Date, showSeconds = false) =>
  `${formatDateInputValue(value)}T${formatTimeInputValue(value, showSeconds)}`;

export const toDateInputValue = (value: DateValue | undefined): string | undefined => {
  if (value == null) return undefined;
  if (value instanceof Date) return formatDateInputValue(value);
  return value;
};

export const parseDateValue = (value: DateValue | undefined): Date | undefined => {
  if (value == null) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value !== "string") return undefined;

  const datePart = value.includes("T") ? value.split("T")[0] : value;
  const [year, month, day] = (datePart ?? "").split("-").map(Number);
  if (!year || !month || !day) return undefined;

  const parsedDate = new Date(year, month - 1, day);
  if (Number.isNaN(parsedDate.getTime())) return undefined;
  return parsedDate;
};

export const parseTimeValue = (value: string | undefined): { hour: number; minute: number; second: number } | undefined => {
  if (!value) return undefined;
  const [hourRaw, minuteRaw, secondRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const second = Number(secondRaw ?? "0");
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second)) return undefined;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return undefined;
  return { hour, minute, second };
};

export const applyTimeToDate = (date: Date, timeValue: string | undefined): Date => {
  const next = new Date(date);
  const parsed = parseTimeValue(timeValue);
  if (!parsed) return next;
  next.setHours(parsed.hour, parsed.minute, parsed.second, 0);
  return next;
};

export const getTimeValueFromDateString = (value: string | undefined, showSeconds = false): string => {
  const parsed = parseDateValue(value);
  if (!parsed) return showSeconds ? "00:00:00" : "00:00";
  return formatTimeInputValue(parsed, showSeconds);
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
