import { toCalendarLocale, type OpsLocale } from "@/lib/i18n/messages";

type ServiceTranslator = (key: "all" | "docs" | "whiteboard" | "billing" | "checkout") => string;

export type ServiceCatalogItem = {
  name?: string;
  owner?: string;
  onCall?: string;
  runbook?: string;
  slo?: string;
  repository?: string;
  dashboard?: string;
  dependencies?: string;
};

export type ServiceCatalog = { services?: ServiceCatalogItem[] };

export function parseServiceCatalog(value: string | undefined): ServiceCatalog {
  if (!value) return { services: [] };
  try {
    const parsed = JSON.parse(value) as ServiceCatalog;
    return Array.isArray(parsed.services) ? parsed : { services: [] };
  } catch {
    return { services: [] };
  }
}

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
