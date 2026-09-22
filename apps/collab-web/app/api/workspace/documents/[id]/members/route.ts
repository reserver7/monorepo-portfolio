import { NextRequest } from "next/server";
import { forwardCollabRequest } from "@/lib/auth/collab-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return forwardCollabRequest(request, `/api/documents/${(await context.params).id}/members`);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forwardCollabRequest(request, `/api/documents/${(await context.params).id}/members`);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return forwardCollabRequest(request, `/api/documents/${(await context.params).id}/members`);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const id = (await context.params).id;
  const email = request.nextUrl.searchParams.get("email");
  return forwardCollabRequest(
    request,
    `/api/documents/${id}/members${email ? `?email=${encodeURIComponent(email)}` : ""}`
  );
}
