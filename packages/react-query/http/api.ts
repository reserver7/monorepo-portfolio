import axios, { AxiosError, AxiosResponse } from "axios";

import { resolveHttpErrorMessage } from "./http-error";
import { BaseResponseProps } from "./types";
import { notifyUiError, notifyUiSuccess } from "./notify";

const handleLegacyEnvelopeFailure = (payload: BaseResponseProps<unknown>) => {
  const failed = payload.state === false || payload.response === false;
  if (!failed) {
    return false;
  }
  console.warn(payload.message || "요청 중 오류가 발생했습니다.");
  return true;
};

const onSuccess = (response: AxiosResponse<BaseResponseProps<unknown>>) => {
  if (handleLegacyEnvelopeFailure(response.data)) {
    return Promise.reject(response);
  }

  const method = (response.config.method ?? "get").toUpperCase();
  const isActionRequest = method !== "GET" && method !== "HEAD";
  if (isActionRequest) {
    const actionMessage =
      method === "POST"
        ? "생성이 완료되었습니다."
        : method === "DELETE"
          ? "삭제가 완료되었습니다."
          : "요청이 완료되었습니다.";
    notifyUiSuccess(actionMessage);
  }

  return Promise.resolve(response);
};

const onError = (error: AxiosError<BaseResponseProps<unknown>>) => {
  const messageText = resolveHttpErrorMessage(error);
  console.error(messageText);
  const method = (error.config?.method ?? "get").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    notifyUiError(messageText);
  }

  return Promise.reject(error);
};

export const api = axios.create({
  baseURL: `/`,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.response.use(onSuccess, onError);
