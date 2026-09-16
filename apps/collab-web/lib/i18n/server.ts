import { cookies, headers } from "next/headers";
import { resolveLocale } from "@repo/configs/i18n";
import { COLLAB_DEFAULT_LOCALE, type CollabLocale } from "@/lib/i18n/messages";

export const resolveRequestLocale = async (): Promise<CollabLocale> => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  return resolveLocale({
    cookieLocale: cookieStore.get("collab-locale")?.value,
    acceptLanguage: headerStore.get("accept-language")
  }) as CollabLocale;
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
      description:
        "ドキュメントとホワイトボードを1つのワークスペースで提供するリアルタイム共同作業プラットフォーム",
      keywords: ["コラボレーション", "ドキュメント", "ホワイトボード", "リアルタイム編集", "ワークスペース"],
      ogLocale: "ja_JP",
      docsEntityLabel: "ドキュメント",
      whiteboardEntityLabel: "ホワイトボード"
    }
  };

  return dictionary[locale] ?? dictionary[COLLAB_DEFAULT_LOCALE];
};

export const getCollabMessages = async (locale: CollabLocale): Promise<Record<string, unknown>> => {
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
