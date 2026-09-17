import { NextResponse } from "next/server";
import { COLLAB_AUTH_COOKIE } from "@/lib/auth/config";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COLLAB_AUTH_COOKIE);
  return response;
}
