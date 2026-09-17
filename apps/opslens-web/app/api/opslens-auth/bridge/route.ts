import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { OPS_REFRESH_COOKIE, resolveAuthApiUrl, type BackendLoginResponse } from "@/lib/auth/server-session";
import { createAuthBridgeToken } from "@/lib/auth/bridge";

const allowedReturnTo = (value: string | null): URL | null => {
  if (!value) return null;
  try {
    const target = new URL(value);
    const allowedOrigin = process.env.COLLAB_WEB_URL ?? "http://localhost:3000";
    return target.origin === new URL(allowedOrigin).origin ? target : null;
  } catch {
    return null;
  }
};

const loginRedirect = (request: NextRequest, returnTo: URL) => {
  const login = new URL("/login", request.url);
  login.searchParams.set(
    "next",
    `/api/opslens-auth/bridge?returnTo=${encodeURIComponent(returnTo.toString())}`
  );
  return NextResponse.redirect(login);
};

export async function GET(request: NextRequest) {
  const returnTo = allowedReturnTo(request.nextUrl.searchParams.get("returnTo"));
  if (!returnTo) return NextResponse.json({ message: "Invalid return URL" }, { status: 400 });

  const refreshToken = (await cookies()).get(OPS_REFRESH_COOKIE)?.value;
  if (!refreshToken) return loginRedirect(request, returnTo);

  const response = await fetch(`${resolveAuthApiUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store"
  });
  if (!response.ok) return loginRedirect(request, returnTo);

  const session = (await response.json()) as BackendLoginResponse & {
    user: { id: string; email: string; name: string; role: "admin" | "operator" | "viewer" };
  };
  const token = createAuthBridgeToken(session.user, "bridge", 120);
  returnTo.searchParams.set("token", token);
  return NextResponse.redirect(returnTo);
}
