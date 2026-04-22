import ko from "./messages/ko.json";
import en from "./messages/en.json";
import ja from "./messages/ja.json";

export type OpsLocale = "ko" | "en" | "ja";

export const OPS_DEFAULT_LOCALE: OpsLocale = "ko";

export const opslensMessages: Record<OpsLocale, Record<string, unknown>> = {
  ko,
  en,
  ja
};

export function toCalendarLocale(locale: OpsLocale): string {
  if (locale === "en") return "en-US";
  if (locale === "ja") return "ja-JP";
  return "ko-KR";
}
