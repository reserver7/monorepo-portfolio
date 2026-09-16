export const API_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  UPSTREAM_UNAVAILABLE: "UPSTREAM_UNAVAILABLE",
  INTERNAL: "INTERNAL"
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export type ApiErrorPayload = {
  code: ApiErrorCode | (string & {});
  params?: Record<string, string | number>;
  message?: string;
};

export const isApiErrorPayload = (value: unknown): value is ApiErrorPayload => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<ApiErrorPayload>;
  return typeof payload.code === "string" && payload.code.trim().length > 0;
};

export const createApiErrorPayload = (
  code: ApiErrorCode,
  params?: Record<string, string | number>
): ApiErrorPayload => ({
  code,
  ...(params ? { params } : {})
});
