import { NextRequest } from "next/server";
import { forwardCollabRequest } from "@/lib/auth/collab-proxy";

type RouteContext = { params: Promise<{ kind: string; id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { kind, id } = await context.params;
  return forwardCollabRequest(request, `/api/workspace/trash/${kind}/${id}/restore`);
}
