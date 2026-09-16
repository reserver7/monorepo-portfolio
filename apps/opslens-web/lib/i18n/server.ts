import { cookies, headers } from "next/headers";
import { resolveLocale } from "@repo/configs/i18n";
import { OPS_DEFAULT_LOCALE, type OpsLocale } from "@/lib/i18n/messages";

export const resolveRequestLocale = async (): Promise<OpsLocale> => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  return resolveLocale({
    cookieLocale: cookieStore.get("opslens-locale")?.value,
    acceptLanguage: headerStore.get("accept-language")
  }) as OpsLocale;
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

export const getOpsMessages = async (locale: OpsLocale): Promise<Record<string, unknown>> => {
  if (locale === "en") {
    const mod = await import("./messages/en.json");
    return mod.default as Record<string, unknown>;
  }
  if (locale === "ja") {
    const mod = await import("./messages/ja.json");
    return mod.default as Record<string, unknown>;
  }
  const mod = await import("./messages/ko.json");
  return mod.default as Record<string, unknown>;
};
