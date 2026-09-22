import { NextRequest } from "next/server";
import { forwardCollabRequest } from "@/lib/auth/collab-proxy";

export async function PATCH(request: NextRequest) {
  return forwardCollabRequest(request, "/api/notifications/read-all");
}
