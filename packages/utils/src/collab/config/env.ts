import type { AccessRole } from "../types";
import { coerceAccessRole } from "../core/role";
import { trimTrailingSlash } from "../../string/trim-trailing-slash";

const normalizeUrl = (rawValue: string | undefined, fallback: string): string => {
  const value = rawValue?.trim();
  if (!value) {
    return fallback;
  }

  return trimTrailingSlash(value);
};

const normalizeRole = (rawRole: string | undefined): AccessRole => {
  return coerceAccessRole(rawRole, "editor");
};

export const createClientEnv = (apiUrl: string | undefined, role: string | undefined) => {
  return {
    apiBaseUrl: normalizeUrl(apiUrl, "http://localhost:4000"),
    defaultRole: normalizeRole(role)
  };
};
