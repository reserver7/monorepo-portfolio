import { NextRequest } from "next/server";
import { forwardCollabRequest } from "@/lib/auth/collab-proxy";

export async function GET(request: NextRequest) {
  return forwardCollabRequest(request, "/api/workspace/favorites");
}

export async function PATCH(request: NextRequest) {
  return forwardCollabRequest(request, "/api/workspace/favorites");
}
