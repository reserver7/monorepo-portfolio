import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, resolveAuthApiUrl } from "@/lib/auth/server-session";

export async function DELETE(request: NextRequest) {
  const upstream = await fetch(`${resolveAuthApiUrl()}/auth/account`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: request.headers.get("authorization") ?? ""
    },
    body: JSON.stringify(await request.json().catch(() => ({}))),
    cache: "no-store"
  });

  const response = NextResponse.json(await upstream.json(), { status: upstream.status });
  if (upstream.ok) clearSessionCookie(response);
  return response;
}
