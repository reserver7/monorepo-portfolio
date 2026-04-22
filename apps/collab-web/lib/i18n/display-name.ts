const GUEST_PATTERN = /^(?:게스트|guest|ゲスト)(?:[\s-]?(\d{2,4}))?$/i;

const resolveLocale = (locale?: string): "ko" | "en" | "ja" => {
  const normalized = locale?.toLowerCase();
  if (normalized?.startsWith("ja")) {
    return "ja";
  }
  if (normalized?.startsWith("en")) {
    return "en";
  }
  return "ko";
};

const guestLabelByLocale: Record<"ko" | "en" | "ja", string> = {
  ko: "게스트",
  en: "Guest",
  ja: "ゲスト"
};

export const normalizeGuestDisplayName = (value: string, locale?: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  const match = trimmed.match(GUEST_PATTERN);
  if (!match) {
    return trimmed;
  }

  const number = match[1]?.trim() ?? "";
  const label = guestLabelByLocale[resolveLocale(locale)];
  return number ? `${label} ${number}` : label;
};

export const createLocaleGuestName = (locale?: string): string => {
  const number = Math.floor(100 + Math.random() * 900);
  const label = guestLabelByLocale[resolveLocale(locale)];
  return `${label} ${number}`;
};
