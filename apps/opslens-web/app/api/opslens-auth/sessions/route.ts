import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { resolveAuthApiUrl, OPS_REFRESH_COOKIE } from "@/lib/auth/server-session";

const forwardHeaders = async (request: NextRequest): Promise<HeadersInit> => {
  const refreshToken = (await cookies()).get(OPS_REFRESH_COOKIE)?.value;
  return {
    Accept: "application/json",
    Authorization: request.headers.get("authorization") ?? "",
    ...(refreshToken ? { "x-opslens-refresh-token": refreshToken } : {})
  };
};

export async function GET(request: NextRequest) {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/sessions`, {
    headers: await forwardHeaders(request),
    cache: "no-store"
  });
  return NextResponse.json(await response.json(), { status: response.status });
}

export async function POST(request: NextRequest) {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/sessions/logout-all`, {
    method: "POST",
    headers: await forwardHeaders(request),
    cache: "no-store"
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
