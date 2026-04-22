import { cookies, headers } from "next/headers";
import { OPS_DEFAULT_LOCALE, type OpsLocale } from "@/lib/i18n/messages";

const ACCEPT_LANGUAGE_SPLIT_PATTERN = /[,;]/;

const isOpsLocale = (value: string | null | undefined): value is OpsLocale => {
  return value === "ko" || value === "en" || value === "ja";
};

const extractLocaleFromAcceptLanguage = (acceptLanguage: string | null): OpsLocale | null => {
  if (!acceptLanguage) {
    return null;
  }

  const candidates = acceptLanguage
    .split(ACCEPT_LANGUAGE_SPLIT_PATTERN)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0);

  for (const candidate of candidates) {
    const normalized = candidate.split("-")[0];
    if (isOpsLocale(normalized)) {
      return normalized;
    }
  }

  return null;
};

export const resolveRequestLocale = async (): Promise<OpsLocale> => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("opslens-locale")?.value;
  if (isOpsLocale(localeCookie)) {
    return localeCookie;
  }

  const headerStore = await headers();
  return extractLocaleFromAcceptLanguage(headerStore.get("accept-language")) ?? OPS_DEFAULT_LOCALE;
};

export const getOpsMetadataText = (locale: OpsLocale) => {
  const dictionary: Record<OpsLocale, { description: string; keywords: string[]; ogLocale: string }> = {
    ko: {
      description: "운영 로그/에러/배포 이력 분석 대시보드",
      keywords: ["ops", "dashboard", "logs", "issues", "deployments"],
      ogLocale: "ko_KR"
    },
    en: {
      description: "Operations dashboard for logs, incidents, and deployment history",
      keywords: ["operations", "dashboard", "logs", "incidents", "deployments"],
      ogLocale: "en_US"
    },
    ja: {
      description: "ログ・障害・デプロイ履歴を分析する運用ダッシュボード",
      keywords: ["運用", "ダッシュボード", "ログ", "障害", "デプロイ"],
      ogLocale: "ja_JP"
    }
  };

  return dictionary[locale] ?? dictionary[OPS_DEFAULT_LOCALE];
};
