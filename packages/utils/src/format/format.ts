import { TIME_ZONE } from "@repo/configs/i18n";

export const formatDateTime = (value?: string | Date | null, locale = "ko-KR"): string => {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

export const formatNumber = (value?: number | null, locale = "ko-KR"): string => {
  if (typeof value !== "number") return "0";
  return new Intl.NumberFormat(locale).format(value);
};

export const formatCurrency = (value?: number | null, locale = "ko-KR", currency = "KRW"): string => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
};

export const formatPercent = (value?: number | null, locale = "ko-KR"): string => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 2
  }).format(value);
};

export const formatPlural = (value: number, locale = "ko-KR"): Intl.LDMLPluralRule =>
  new Intl.PluralRules(locale).select(value);

export const toIsoDate = (value: Date): string => {
  return value.toISOString().slice(0, 10);
};
