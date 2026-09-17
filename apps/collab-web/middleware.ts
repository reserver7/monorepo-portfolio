import { NextResponse, type NextRequest } from "next/server";
import { COLLAB_AUTH_COOKIE, isProtectedPath, requiredAuthEnv } from "./lib/auth/config";

export async function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) return NextResponse.next();

  const sessionToken = request.cookies.get(COLLAB_AUTH_COOKIE)?.value;
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  if (!sessionToken) return NextResponse.redirect(login);

  const response = await fetch(`${requiredAuthEnv("OPSLENS_WEB_URL")}/api/opslens-auth/bridge/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-opslens-auth-bridge": requiredAuthEnv("OPSLENS_AUTH_BRIDGE_SECRET")
    },
    body: JSON.stringify({ token: sessionToken }),
    cache: "no-store"
  });
  if (response.ok) return NextResponse.next();

  const redirectResponse = NextResponse.redirect(login);
  redirectResponse.cookies.delete(COLLAB_AUTH_COOKIE);
  return redirectResponse;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
