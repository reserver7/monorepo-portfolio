import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  createSessionResponse,
  OPS_REFRESH_COOKIE,
  parseServerErrorMessage,
  resolveAuthApiUrl,
  type BackendLoginResponse
} from "@/lib/auth/server-session";

const LOGIN_ACTIONS = new Set(["login", "signup"]);

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (!LOGIN_ACTIONS.has(action) && action !== "refresh" && action !== "logout") {
    return NextResponse.json({ message: "지원하지 않는 인증 요청입니다." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(OPS_REFRESH_COOKIE)?.value;

  if (action === "logout") {
    const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
    if (accessToken) {
      await fetch(`${resolveAuthApiUrl()}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(refreshToken ? { refreshToken } : {})
      }).catch(() => undefined);
    }
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  }

  if (action === "refresh" && !refreshToken) {
    return NextResponse.json({ message: "세션이 만료되었습니다." }, { status: 401 });
  }

  const upstream = await fetch(`${resolveAuthApiUrl()}/auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(action === "refresh" ? { refreshToken } : body),
    cache: "no-store"
  });

  if (!upstream.ok) {
    const response = NextResponse.json(
      { message: await parseServerErrorMessage(upstream) },
      { status: upstream.status }
    );
    if (action === "refresh") clearSessionCookie(response);
    return response;
  }

  const payload = (await upstream.json()) as BackendLoginResponse;
  return createSessionResponse(payload, body.rememberMe !== false);
}
