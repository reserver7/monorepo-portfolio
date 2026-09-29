import { NextRequest, NextResponse } from "next/server";
import { resolveAuthApiUrl } from "@/lib/auth/server-session";

const forward = async (request: NextRequest, method: "GET" | "POST" | "DELETE") => {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/two-factor`, {
    method,
    headers: {
      Accept: "application/json",
      ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
      Authorization: request.headers.get("authorization") ?? ""
    },
    ...(method !== "GET" ? { body: JSON.stringify(await request.json().catch(() => ({}))) } : {}),
    cache: "no-store"
  });
  return NextResponse.json(await response.json(), { status: response.status });
};

export const GET = (request: NextRequest) => forward(request, "GET");
export const POST = (request: NextRequest) => forward(request, "POST");
export const DELETE = (request: NextRequest) => forward(request, "DELETE");
