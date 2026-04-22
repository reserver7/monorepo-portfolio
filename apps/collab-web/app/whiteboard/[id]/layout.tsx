import type { Metadata } from "next";
import { createEntityMetadata } from "@repo/theme";
import { getAppMetadataText, resolveRequestLocale } from "@/lib/i18n/server";

interface BoardRoomLayoutProps {
  children: React.ReactNode;
}

interface BoardRoomMetadataProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BoardRoomMetadataProps): Promise<Metadata> {
  const locale = await resolveRequestLocale();
  const text = getAppMetadataText(locale);
  const { id } = await params;
  return createEntityMetadata({
    appName: text.appName,
    entityLabel: text.whiteboardEntityLabel,
    entityId: id,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    pathname: `/whiteboard/${id}`
  });
}

export default function BoardRoomLayout({ children }: BoardRoomLayoutProps) {
  return children;
}
