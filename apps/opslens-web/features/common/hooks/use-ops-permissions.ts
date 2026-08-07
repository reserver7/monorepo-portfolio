"use client";

import { readAuthSession } from "@/lib/auth";

export function useOpsPermissions() {
  const role = readAuthSession()?.user.role;
  return {
    role,
    canOperate: role === "admin" || role === "operator",
    canAdminister: role === "admin"
  };
}
