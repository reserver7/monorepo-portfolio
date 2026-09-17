import { NextRequest, NextResponse } from "next/server";
import { COLLAB_AUTH_COOKIE } from "./config";

const backendUrl = (path: string): string => {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base) throw new Error("Missing required environment variable: NEXT_PUBLIC_API_URL");
  return `${base.replace(/\/$/, "")}${path}`;
};

export async function forwardCollabRequest(request: NextRequest, path: string): Promise<NextResponse> {
  const sessionToken = request.cookies.get(COLLAB_AUTH_COOKIE)?.value;
  const testBypass = process.env.COLLAB_E2E_AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production";
  if (!sessionToken && !testBypass) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  const response = await fetch(backendUrl(path), {
    method: request.method,
    headers: {
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(body ? { "Content-Type": request.headers.get("content-type") ?? "application/json" } : {})
    },
    body,
    cache: "no-store"
  });

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" }
  });
}
