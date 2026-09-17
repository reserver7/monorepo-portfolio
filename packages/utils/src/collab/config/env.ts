import type { AccessRole } from "../types";
import { coerceAccessRole } from "../core/role";
import { normalizeUrl } from "../../string/normalize-url";

const normalizeRole = (rawRole: string | undefined): AccessRole => {
  return coerceAccessRole(rawRole, "editor");
};

export const createClientEnv = (apiUrl: string | undefined, role: string | undefined) => {
  return {
    apiBaseUrl: normalizeUrl(apiUrl, "http://localhost:4000"),
    defaultRole: normalizeRole(role)
  };
};
