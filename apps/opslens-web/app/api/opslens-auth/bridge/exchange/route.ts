import { NextRequest, NextResponse } from "next/server";
import { createAuthBridgeToken, verifyAuthBridgeToken } from "@/lib/auth/bridge";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-opslens-auth-bridge") !== process.env.OPSLENS_AUTH_BRIDGE_SECRET?.trim()) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { token?: string };
  try {
    const token = verifyAuthBridgeToken(body.token ?? "");
    if (token.type === "bridge") {
      return NextResponse.json({
        sessionToken: createAuthBridgeToken(token, "session", 60 * 60 * 24 * 14),
        user: token
      });
    }
    if (token.type !== "session") throw new Error("Invalid bridge token type");
    return NextResponse.json({ user: token });
  } catch {
    return NextResponse.json({ message: "Invalid or expired bridge token" }, { status: 401 });
  }
}
