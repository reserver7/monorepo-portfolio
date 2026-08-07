import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { oauthAuthOptions } from "@/lib/auth/oauth";
import {
  createSessionResponse,
  parseServerErrorMessage,
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
    return NextResponse.json({ message: "OAuth 세션 정보가 유효하지 않습니다." }, { status: 401 });
  }

  const bridgeSecret = process.env.OPSLENS_AUTH_BRIDGE_SECRET?.trim();
  if (!bridgeSecret) {
    return NextResponse.json({ message: "서버 OAuth 브리지 시크릿이 설정되지 않았습니다." }, { status: 500 });
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
    return NextResponse.json(
      { message: "인증 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: await parseServerErrorMessage(response) },
      { status: response.status }
    );
  }

  const payload = (await response.json()) as BackendLoginResponse;
  return createSessionResponse(payload);
}
