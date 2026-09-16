import { isApiErrorPayload, type ApiErrorPayload } from "@repo/configs/errors";
import { AxiosError } from "axios";

export class ApiError extends Error {
  readonly code: string;
  readonly params: Record<string, string | number>;

  constructor(payload: ApiErrorPayload, fallbackMessage = "Request failed") {
    super(payload.message ?? fallbackMessage);
    this.name = "ApiError";
    this.code = payload.code;
    this.params = payload.params ?? {};
  }
}

export const getApiError = (error: unknown): ApiError | null => {
  if (error instanceof ApiError) return error;
  if (error instanceof AxiosError && isApiErrorPayload(error.response?.data)) {
    return new ApiError(error.response.data);
  }
  return null;
};

export const resolveApiErrorCode = (error: unknown): string | null => getApiError(error)?.code ?? null;
