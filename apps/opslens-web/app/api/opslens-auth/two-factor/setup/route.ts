import { NextRequest, NextResponse } from "next/server";
import { resolveAuthApiUrl } from "@/lib/auth/server-session";

export async function DELETE(request: NextRequest) {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/two-factor/setup`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: request.headers.get("authorization") ?? ""
    },
    cache: "no-store"
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
