import type { Metadata } from "next";
import { createEntityMetadata } from "@repo/theme";

interface BoardRoomLayoutProps {
  children: React.ReactNode;
}

interface BoardRoomMetadataProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BoardRoomMetadataProps): Promise<Metadata> {
  const { id } = await params;
  return createEntityMetadata({
    appName: "Realtime Whiteboard",
    entityLabel: "화이트보드",
    entityId: id,
    appUrl: process.env.NEXT_PUBLIC_WHITEBOARD_APP_URL,
    pathname: `/board/${id}`
  });
}

export default function BoardRoomLayout({ children }: BoardRoomLayoutProps) {
  return children;
}
