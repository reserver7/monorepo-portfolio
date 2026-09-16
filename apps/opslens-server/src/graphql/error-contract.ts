import { HttpException } from "@nestjs/common";
const API_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  UPSTREAM_UNAVAILABLE: "UPSTREAM_UNAVAILABLE",
  INTERNAL: "INTERNAL"
} as const;
type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

type ErrorLike = {
  originalError?: unknown;
  extensions?: Record<string, unknown>;
};

const statusToCode = (status: number): ApiErrorCode => {
  if (status === 400) return API_ERROR_CODES.VALIDATION;
  if (status === 401 || status === 403) return API_ERROR_CODES.UNAUTHORIZED;
  if (status === 404) return API_ERROR_CODES.NOT_FOUND;
  if (status === 502 || status === 503 || status === 504) return API_ERROR_CODES.UPSTREAM_UNAVAILABLE;
  return API_ERROR_CODES.INTERNAL;
};

export const resolveApiErrorContract = (
  error: ErrorLike
): { code: ApiErrorCode; params?: Record<string, string | number> } => {
  if (error.originalError instanceof HttpException) {
    const response = error.originalError.getResponse();
    if (typeof response === "object" && response !== null && "code" in response) {
      const code = (response as { code?: ApiErrorCode }).code;
      if (code) return { code };
    }
    return { code: statusToCode(error.originalError.getStatus()) };
  }

  const extensionCode = error.extensions?.code;
  if (
    extensionCode === API_ERROR_CODES.UNAUTHORIZED ||
    extensionCode === API_ERROR_CODES.VALIDATION ||
    extensionCode === API_ERROR_CODES.NOT_FOUND ||
    extensionCode === API_ERROR_CODES.UPSTREAM_UNAVAILABLE ||
    extensionCode === API_ERROR_CODES.INTERNAL
  ) {
    return { code: extensionCode };
  }

  return { code: API_ERROR_CODES.INTERNAL };
};
