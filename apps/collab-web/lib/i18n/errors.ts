import { getApiError } from "@repo/react-query/http";

type Translate = ((key: string, values?: Record<string, string | number>) => string) & {
  has?: (key: string) => boolean;
};

export const resolveLocalizedError = (error: unknown, t: Translate, fallback: string): string => {
  const apiError = getApiError(error);
  if (apiError) {
    const key = {
      UNAUTHORIZED: "api.UNAUTHORIZED",
      VALIDATION: "api.VALIDATION",
      NOT_FOUND: "api.NOT_FOUND",
      UPSTREAM_UNAVAILABLE: "api.UPSTREAM_UNAVAILABLE",
      INTERNAL: "api.INTERNAL"
    }[apiError.code];
    if (!key) return fallback;
    if (t.has?.(key) === false) return fallback;
    return t(key, apiError.params);
  }
  return error instanceof Error && error.message.trim() ? error.message : fallback;
};
