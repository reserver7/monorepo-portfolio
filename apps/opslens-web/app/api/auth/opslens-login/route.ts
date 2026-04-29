import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { opslensClientEnv } from "@/lib/config";
import { oauthAuthOptions } from "@/lib/auth/oauth";

const resolveAuthApiUrl = (): string => {
  const trimmed = opslensClientEnv.apiUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/graphql") ? trimmed.slice(0, -"/graphql".length) : trimmed;
};

const parseServerErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    const message = payload.message;
    if (Array.isArray(message)) {
      const joined = message.filter((item) => typeof item === "string").join(", ");
      if (joined.length > 0) return joined;
    }
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  } catch {
    // no-op
  }
  return "OAuth 로그인 처리에 실패했습니다.";
};

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

  const response = await fetch(`${resolveAuthApiUrl()}/auth/oauth-login`, {
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
      name: name && name.length > 0 ? name : email.split("@")[0] ?? "Ops User"
    })
  });

  if (!response.ok) {
    return NextResponse.json({ message: await parseServerErrorMessage(response) }, { status: response.status });
  }

  const payload = (await response.json()) as unknown;
  return NextResponse.json(payload);
}
