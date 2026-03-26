import type { AccessRole } from "@repo/collab-types";

export const coerceAccessRole = (
  rawValue: string | null | undefined,
  fallback: AccessRole = "editor"
): AccessRole => {
  if (rawValue === "viewer" || rawValue === "editor") {
    return rawValue;
  }

  return fallback;
};
