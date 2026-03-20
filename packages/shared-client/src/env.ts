import type { AccessRole } from "@repo/shared-types";

const normalizeUrl = (rawValue: string | undefined, fallback: string): string => {
  const value = rawValue?.trim();
  if (!value) {
    return fallback;
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const normalizeRole = (rawRole: string | undefined): AccessRole => {
  if (rawRole === "viewer") {
    return "viewer";
  }

  return "editor";
};

export const createClientEnv = (apiUrl: string | undefined, role: string | undefined) => {
  return {
    apiBaseUrl: normalizeUrl(apiUrl, "http://localhost:4000"),
    defaultRole: normalizeRole(role)
  };
};
