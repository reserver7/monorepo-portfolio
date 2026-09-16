import { SUPPORTED_LOCALES, DEFAULT_LOCALE, toIntlLocale, type Locale } from "@repo/configs/i18n";

export type OpsLocale = Locale;
export const OPS_LOCALE_VALUES = SUPPORTED_LOCALES;
export const OPS_DEFAULT_LOCALE: OpsLocale = DEFAULT_LOCALE;

export function toCalendarLocale(locale: OpsLocale): string {
  return toIntlLocale(locale);
}
