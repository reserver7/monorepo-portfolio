import { toCalendarLocale, type OpsLocale } from "@/lib/i18n/messages";

type ServiceTranslator = (key: "all" | "docs" | "whiteboard" | "billing" | "checkout") => string;

export function resolveServiceLabel(serviceName: string, tService: ServiceTranslator): string {
  if (serviceName === "all") return tService("all");
  if (serviceName === "docs") return tService("docs");
  if (serviceName === "whiteboard") return tService("whiteboard");
  if (serviceName === "billing") return tService("billing");
  if (serviceName === "checkout") return tService("checkout");
  return serviceName;
}

export function formatDateByLocale(value: string | undefined, locale: OpsLocale): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(toCalendarLocale(locale), { year: "numeric", month: "short", day: "numeric" }).format(date);
}

export function formatDateTimeByLocale(value: string | undefined, locale: OpsLocale): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(toCalendarLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatDateRangeLabel(from: string | undefined, to: string | undefined, locale: OpsLocale): string | undefined {
  if (!from && !to) return undefined;
  return `${formatDateByLocale(from, locale)} ~ ${formatDateByLocale(to, locale)}`;
}
