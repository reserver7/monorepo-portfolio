import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveAuthApiUrl, OPS_REFRESH_COOKIE } from "@/lib/auth/server-session";

export async function DELETE(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const refreshToken = (await cookies()).get(OPS_REFRESH_COOKIE)?.value;
  const response = await fetch(`${resolveAuthApiUrl()}/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: request.headers.get("authorization") ?? "",
      ...(refreshToken ? { "x-opslens-refresh-token": refreshToken } : {})
    },
    cache: "no-store"
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
