import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  createSessionResponse,
  OPS_REFRESH_COOKIE,
  resolveAuthApiUrl,
  type BackendLoginResponse
} from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(OPS_REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: "세션이 만료되었습니다." }, { status: 401 });
  }

  const refreshResponse = await fetch(`${resolveAuthApiUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store"
  });
  if (!refreshResponse.ok) {
    const response = NextResponse.json({ message: "세션이 만료되었습니다." }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }

  const session = (await refreshResponse.json()) as BackendLoginResponse;
  const upstream = await fetch(`${resolveAuthApiUrl()}/ops/log-tail${request.nextUrl.search}`, {
    headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "text/event-stream" },
    cache: "no-store"
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ message: "라이브 로그 연결에 실패했습니다." }, { status: upstream.status || 502 });
  }

  const response = new NextResponse(upstream.body, {
    headers: {
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no"
    }
  });
  createSessionResponse(session).cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}
