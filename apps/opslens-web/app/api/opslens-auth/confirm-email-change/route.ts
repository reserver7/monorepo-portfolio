import { NextRequest, NextResponse } from "next/server";
import { resolveAuthApiUrl } from "@/lib/auth/server-session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ message: "이메일 변경 토큰이 필요합니다." }, { status: 400 });
  const response = await fetch(
    `${resolveAuthApiUrl()}/auth/confirm-email-change?token=${encodeURIComponent(token)}`,
    {
      cache: "no-store"
    }
  );
  return NextResponse.json(await response.json(), { status: response.status });
}
