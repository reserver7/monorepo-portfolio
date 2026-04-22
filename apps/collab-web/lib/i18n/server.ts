import { cookies, headers } from "next/headers";
import { COLLAB_DEFAULT_LOCALE, COLLAB_LOCALE_VALUES, type CollabLocale } from "@/lib/i18n/messages";

const ACCEPT_LANGUAGE_SPLIT_PATTERN = /[,;]/;

const isCollabLocale = (value: string | null | undefined): value is CollabLocale => {
  return Boolean(value) && COLLAB_LOCALE_VALUES.includes(value as CollabLocale);
};

const extractLocaleFromAcceptLanguage = (acceptLanguage: string | null): CollabLocale | null => {
  if (!acceptLanguage) {
    return null;
  }

  const candidates = acceptLanguage
    .split(ACCEPT_LANGUAGE_SPLIT_PATTERN)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0);

  for (const candidate of candidates) {
    const normalized = candidate.split("-")[0];
    if (isCollabLocale(normalized)) {
      return normalized;
    }
  }

  return null;
};

export const resolveRequestLocale = async (): Promise<CollabLocale> => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("collab-locale")?.value;
  if (isCollabLocale(localeCookie)) {
    return localeCookie;
  }

  const headerStore = await headers();
  return extractLocaleFromAcceptLanguage(headerStore.get("accept-language")) ?? COLLAB_DEFAULT_LOCALE;
};

export const getAppMetadataText = (locale: CollabLocale) => {
  const dictionary: Record<
    CollabLocale,
    {
      appName: string;
      description: string;
      keywords: string[];
      ogLocale: string;
      docsEntityLabel: string;
      whiteboardEntityLabel: string;
    }
  > = {
    ko: {
      appName: "Collaborative Suite",
      description: "문서와 화이트보드를 하나의 워크스페이스에서 제공하는 실시간 협업 플랫폼",
      keywords: ["협업", "문서", "화이트보드", "실시간 편집", "collaboration"],
      ogLocale: "ko_KR",
      docsEntityLabel: "문서",
      whiteboardEntityLabel: "화이트보드"
    },
    en: {
      appName: "Collaborative Suite",
      description: "A real-time collaboration workspace for documents and whiteboards",
      keywords: ["collaboration", "documents", "whiteboard", "realtime editing", "workspace"],
      ogLocale: "en_US",
      docsEntityLabel: "Document",
      whiteboardEntityLabel: "Whiteboard"
    },
    ja: {
      appName: "Collaborative Suite",
      description: "ドキュメントとホワイトボードを1つのワークスペースで提供するリアルタイム共同作業プラットフォーム",
      keywords: ["コラボレーション", "ドキュメント", "ホワイトボード", "リアルタイム編集", "ワークスペース"],
      ogLocale: "ja_JP",
      docsEntityLabel: "ドキュメント",
      whiteboardEntityLabel: "ホワイトボード"
    }
  };

  return dictionary[locale] ?? dictionary[COLLAB_DEFAULT_LOCALE];
};
