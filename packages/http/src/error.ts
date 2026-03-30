import { AxiosError } from "axios";

type ErrorPayload = {
  message?: unknown;
  error?: unknown;
  errors?: Array<{ message?: unknown }>;
};

const resolveMessageFromPayload = (payload: unknown): string | null => {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload.trim();
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const typed = payload as ErrorPayload;
  if (typeof typed.message === "string" && typed.message.trim().length > 0) {
    return typed.message.trim();
  }
  if (typeof typed.error === "string" && typed.error.trim().length > 0) {
    return typed.error.trim();
  }
  const firstGraphqlError = typed.errors?.[0]?.message;
  if (typeof firstGraphqlError === "string" && firstGraphqlError.trim().length > 0) {
    return firstGraphqlError.trim();
  }

  return null;
};

export const resolveHttpErrorMessage = (error: unknown): string => {
  if (!(error instanceof AxiosError)) {
    return error instanceof Error ? error.message : "요청 중 오류가 발생했습니다.";
  }

  const responseMessage = resolveMessageFromPayload(error.response?.data);
  if (responseMessage) {
    return responseMessage;
  }

  if (error.code === "ECONNABORTED") {
    return "요청 시간이 초과되었습니다.";
  }

  if (typeof error.response?.status === "number") {
    return `요청 실패 (${error.response.status})`;
  }

  if (error.message.trim().length > 0) {
    return error.message;
  }

  return "요청 중 오류가 발생했습니다.";
};
