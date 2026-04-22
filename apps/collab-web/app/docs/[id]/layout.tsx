import type { Metadata } from "next";
import { createEntityMetadata } from "@repo/theme";
import { getAppMetadataText, resolveRequestLocale } from "@/lib/i18n/server";

interface DocRoomLayoutProps {
  children: React.ReactNode;
}

interface DocRoomMetadataProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DocRoomMetadataProps): Promise<Metadata> {
  const locale = await resolveRequestLocale();
  const text = getAppMetadataText(locale);
  const { id } = await params;
  return createEntityMetadata({
    appName: text.appName,
    entityLabel: text.docsEntityLabel,
    entityId: id,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    pathname: `/docs/${id}`
  });
}

export default function DocRoomLayout({ children }: DocRoomLayoutProps) {
  return children;
}
