import "server-only";
import { NextResponse } from "next/server";
import { opslensClientEnv } from "@/lib/config";

export const OPS_REFRESH_COOKIE = "opslens.refresh-token";
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

export type BackendLoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: unknown;
};

export const resolveAuthApiUrl = (): string => {
  const trimmed = opslensClientEnv.apiUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/graphql") ? trimmed.slice(0, -"/graphql".length) : trimmed;
};

export const parseServerErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    const message = payload.message;
    if (Array.isArray(message)) return message.filter((item) => typeof item === "string").join(", ");
    if (typeof message === "string" && message.trim()) return message;
  } catch {
    // The upstream response did not contain JSON.
  }
  return "인증 요청 처리에 실패했습니다.";
};

export const createSessionResponse = (payload: BackendLoginResponse, rememberMe = true): NextResponse => {
  const { refreshToken, ...clientSession } = payload;
  const response = NextResponse.json(clientSession);
  response.cookies.set(OPS_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/opslens-auth",
    ...(rememberMe ? { maxAge: REFRESH_COOKIE_MAX_AGE } : {})
  });
  return response;
};

export const clearSessionCookie = (response: NextResponse): void => {
  response.cookies.set(OPS_REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/opslens-auth",
    maxAge: 0
  });
};
