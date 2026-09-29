import { NextRequest, NextResponse } from "next/server";
import { resolveAuthApiUrl } from "@/lib/auth/server-session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ message: "인증 토큰이 필요합니다." }, { status: 400 });

  const response = await fetch(
    `${resolveAuthApiUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`,
    {
      cache: "no-store"
    }
  );
  const payload = await response.json().catch(() => ({ message: "이메일 인증에 실패했습니다." }));
  return NextResponse.json(payload, { status: response.status });
}
