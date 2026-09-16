import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { API_ERROR_CODES, createApiErrorPayload } from "@repo/configs/errors";
import { oauthAuthOptions } from "@/lib/auth/oauth";
import {
  createSessionResponse,
  resolveAuthApiUrl,
  type BackendLoginResponse
} from "@/lib/auth/server-session";

export async function POST() {
  const session = await getServerSession(oauthAuthOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  const name = session?.user?.name?.trim();
  const provider = session?.user?.oauthProvider?.trim();
  const providerAccountId = session?.user?.oauthProviderAccountId?.trim();

  if (!email || !provider || !providerAccountId) {
    return NextResponse.json(createApiErrorPayload(API_ERROR_CODES.UNAUTHORIZED), { status: 401 });
  }

  const bridgeSecret = process.env.OPSLENS_AUTH_BRIDGE_SECRET?.trim();
  if (!bridgeSecret) {
    return NextResponse.json(createApiErrorPayload(API_ERROR_CODES.INTERNAL), { status: 500 });
  }

  let response: Response;
  try {
    response = await fetch(`${resolveAuthApiUrl()}/auth/oauth-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-opslens-auth-bridge": bridgeSecret
      },
      body: JSON.stringify({
        provider,
        providerAccountId,
        email,
        name: name && name.length > 0 ? name : (email.split("@")[0] ?? "Ops User")
      })
    });
  } catch {
    return NextResponse.json(createApiErrorPayload(API_ERROR_CODES.UPSTREAM_UNAVAILABLE), { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json(
      createApiErrorPayload(
        response.status === 401 ? API_ERROR_CODES.UNAUTHORIZED : API_ERROR_CODES.INTERNAL
      ),
      { status: response.status }
    );
  }

  const payload = (await response.json()) as BackendLoginResponse;
  return createSessionResponse(payload);
}
