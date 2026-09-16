export const SUPPORTED_LOCALES = ["ko", "en", "ja"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";
export const TIME_ZONE = "Asia/Seoul";

const localeSet = new Set<string>(SUPPORTED_LOCALES);

export const isLocale = (value: string | null | undefined): value is Locale => {
  return value != null && localeSet.has(value);
};

export const normalizeLocale = (value: string | null | undefined): Locale | null => {
  if (!value) return null;
  const language = value.trim().toLowerCase().split(/[-_]/, 1)[0];
  return isLocale(language) ? language : null;
};

type AcceptLanguageCandidate = {
  locale: Locale;
  quality: number;
  order: number;
};

const parseAcceptLanguage = (header: string | null | undefined): AcceptLanguageCandidate[] => {
  if (!header) return [];

  return header
    .split(",")
    .map((entry, order) => {
      const [tag, ...parameters] = entry.trim().split(";");
      const locale = normalizeLocale(tag);
      if (!locale) return null;

      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const parsedQuality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
      const quality = Number.isFinite(parsedQuality) ? Math.min(Math.max(parsedQuality, 0), 1) : 0;

      return { locale, quality, order };
    })
    .filter((candidate): candidate is AcceptLanguageCandidate => candidate !== null)
    .sort((left, right) => right.quality - left.quality || left.order - right.order);
};

export const resolveLocale = ({
  cookieLocale,
  acceptLanguage,
  fallback = DEFAULT_LOCALE
}: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  fallback?: Locale;
} = {}): Locale => {
  return normalizeLocale(cookieLocale) ?? parseAcceptLanguage(acceptLanguage)[0]?.locale ?? fallback;
};

export const toIntlLocale = (locale: Locale): string => {
  if (locale === "en") return "en-US";
  if (locale === "ja") return "ja-JP";
  return "ko-KR";
};
