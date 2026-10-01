import { NextRequest, NextResponse } from "next/server";
import { resolveAuthApiUrl } from "@/lib/auth/server-session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const response = await fetch(
    `${resolveAuthApiUrl()}/auth/invitations/resolve?token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
  return NextResponse.json(await response.json(), { status: response.status });
}
