import { COLLAB_DEFAULT_LOCALE, collabMessages, type CollabLocale } from "@/lib/i18n/messages";

const LOCALE_STORAGE_KEY = "collab-locale-store";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const resolveLocaleFromStorage = (): CollabLocale | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }

    const state = isRecord(parsed.state) ? parsed.state : parsed;
    const locale = state.locale;

    if (locale === "ko" || locale === "en" || locale === "ja") {
      return locale;
    }
  } catch {
    return null;
  }

  return null;
};

const formatTemplate = (template: string, values?: Record<string, string | number>) => {
  if (!values) {
    return template;
  }

  return template.replaceAll(/\{(\w+)\}/g, (full, key) => {
    const value = values[key];
    return value === undefined ? full : String(value);
  });
};

export const getCollabLocale = (): CollabLocale => {
  return resolveLocaleFromStorage() ?? COLLAB_DEFAULT_LOCALE;
};

export const getCollabText = (
  key: string,
  values?: Record<string, string | number>,
  locale = getCollabLocale()
): string => {
  const messages = collabMessages[locale] as Record<string, unknown>;
  const resolved = key.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) {
      return undefined;
    }
    return current[segment];
  }, messages);

  if (typeof resolved !== "string") {
    return key;
  }

  return formatTemplate(resolved, values);
};
