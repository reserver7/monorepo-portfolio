import type { Metadata } from "next";
import { createEntityMetadata } from "@repo/theme";

interface DocRoomLayoutProps {
  children: React.ReactNode;
}

interface DocRoomMetadataProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DocRoomMetadataProps): Promise<Metadata> {
  const { id } = await params;
  return createEntityMetadata({
    appName: "Collaborative Suite",
    entityLabel: "문서",
    entityId: id,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    pathname: `/docs/${id}`
  });
}

export default function DocRoomLayout({ children }: DocRoomLayoutProps) {
  return children;
}
