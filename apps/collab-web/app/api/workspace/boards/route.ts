import { NextRequest } from "next/server";
import { forwardCollabRequest } from "@/lib/auth/collab-proxy";

export async function GET(request: NextRequest) {
  return forwardCollabRequest(request, "/api/boards");
}

export async function POST(request: NextRequest) {
  return forwardCollabRequest(request, "/api/boards");
}
