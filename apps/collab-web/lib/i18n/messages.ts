import ko from "./messages/ko.json";
import en from "./messages/en.json";
import ja from "./messages/ja.json";

export type CollabLocale = "ko" | "en" | "ja";
export const COLLAB_LOCALE_VALUES = ["ko", "en", "ja"] as const;

export const COLLAB_DEFAULT_LOCALE: CollabLocale = "ko";

export const collabMessages: Record<CollabLocale, Record<string, unknown>> = {
  ko,
  en,
  ja
};
