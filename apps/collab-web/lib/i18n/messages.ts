import ko from "./messages/ko.json";
import en from "./messages/en.json";
import ja from "./messages/ja.json";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@repo/configs/i18n";

export type CollabLocale = Locale;
export const COLLAB_LOCALE_VALUES = SUPPORTED_LOCALES;

export const COLLAB_DEFAULT_LOCALE: CollabLocale = DEFAULT_LOCALE;

export const collabMessages: Record<CollabLocale, Record<string, unknown>> = {
  ko,
  en,
  ja
};
