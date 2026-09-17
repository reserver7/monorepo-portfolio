import { NextResponse, type NextRequest } from "next/server";
import { COLLAB_AUTH_COOKIE, requiredAuthEnv } from "@/lib/auth/config";

const safeNext = (value: string | null): string =>
  value?.startsWith("/") && !value.startsWith("//") ? value : "/docs";

export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url));

  const response = await fetch(`${requiredAuthEnv("OPSLENS_WEB_URL")}/api/opslens-auth/bridge/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-opslens-auth-bridge": requiredAuthEnv("OPSLENS_AUTH_BRIDGE_SECRET")
    },
    body: JSON.stringify({ token }),
    cache: "no-store"
  });
  if (!response.ok)
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(next)}&error=bridge`, request.url)
    );

  const { sessionToken } = (await response.json()) as { sessionToken?: string };
  if (!sessionToken)
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(next)}&error=bridge`, request.url)
    );

  const redirectResponse = NextResponse.redirect(new URL(next, request.url));
  redirectResponse.cookies.set(COLLAB_AUTH_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
  return redirectResponse;
}
