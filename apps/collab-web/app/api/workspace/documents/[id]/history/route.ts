import { NextRequest } from "next/server";
import { forwardCollabRequest } from "@/lib/auth/collab-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return forwardCollabRequest(request, `/api/documents/${(await context.params).id}/history`);
}
