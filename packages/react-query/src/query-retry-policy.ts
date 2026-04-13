import { isAxiosError } from "axios";

const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 409, 422]);

export const getHttpStatus = (error: unknown): number | undefined => {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
};

export const shouldRetryQuery = (failureCount: number, error: unknown) => {
  const status = getHttpStatus(error);

  if (status !== undefined && NON_RETRYABLE_STATUS.has(status)) {
    return false;
  }

  // GET 계열 재시도 기본값: 최대 2회
  return failureCount < 2;
};

export const queryRetryDelay = (attemptIndex: number) => {
  const nextDelay = 600 * 2 ** attemptIndex;
  return Math.min(4_000, nextDelay);
};
