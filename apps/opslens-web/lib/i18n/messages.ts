export type OpsLocale = "ko" | "en" | "ja";

export const OPS_DEFAULT_LOCALE: OpsLocale = "ko";

export function toCalendarLocale(locale: OpsLocale): string {
  if (locale === "en") return "en-US";
  if (locale === "ja") return "ja-JP";
  return "ko-KR";
}
