import { NextRequest, NextResponse } from "next/server";
import { resolveAuthApiUrl } from "@/lib/auth/server-session";

export async function POST(request: NextRequest) {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/change-email`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: request.headers.get("authorization") ?? ""
    },
    body: JSON.stringify(await request.json().catch(() => ({}))),
    cache: "no-store"
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
