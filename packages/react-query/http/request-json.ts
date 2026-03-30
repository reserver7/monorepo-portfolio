import type { AxiosRequestConfig, Method } from "axios";
import { createHttpClient } from "./http-client";
import { resolveHttpErrorMessage } from "./http-error";
import { notifyUiError, notifyUiSuccess } from "./notify";

type RequestBody = string | Record<string, unknown> | Array<unknown> | null | undefined;

export type RequestJsonInit = {
  method?: Method;
  headers?: Record<string, string | undefined>;
  body?: RequestBody;
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  successMessage?: string;
  errorMessage?: string;
  notifyOnSuccess?: boolean;
  notifyOnError?: boolean;
};

const stripUndefinedValues = (headers?: Record<string, string | undefined>) => {
  if (!headers) {
    return undefined;
  }

  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      output[key] = value;
    }
  }
  return output;
};

const hasHeader = (headers: Record<string, string> | undefined, target: string) => {
  if (!headers) {
    return false;
  }

  const normalizedTarget = target.toLowerCase();
  return Object.keys(headers).some((key) => key.toLowerCase() === normalizedTarget);
};

const normalizeBody = (body: RequestBody) => {
  if (typeof body === "string") {
    return body;
  }
  if (body === undefined) {
    return undefined;
  }
  return body;
};

const resolveSuccessMessage = (method: Method, override?: string) => {
  if (override) {
    return override;
  }

  const normalized = method.toUpperCase();
  if (normalized === "POST") return "생성이 완료되었습니다.";
  if (normalized === "PUT" || normalized === "PATCH") return "수정이 완료되었습니다.";
  if (normalized === "DELETE") return "삭제가 완료되었습니다.";
  return "요청이 완료되었습니다.";
};

export const requestJson = async <T>(
  apiBaseUrl: string,
  path: string,
  init?: RequestJsonInit
): Promise<T> => {
  const client = createHttpClient(apiBaseUrl);
  const method = (init?.method ?? "GET").toUpperCase() as Method;
  const headers = stripUndefinedValues(init?.headers) ?? {};
  const data = normalizeBody(init?.body);
  const hasBody = data !== undefined && data !== null;
  const shouldAttachJsonContentType = hasBody && method !== "GET" && method !== "HEAD";
  const isActionRequest = method !== "GET" && method !== "HEAD";
  const shouldNotifySuccess = init?.notifyOnSuccess ?? isActionRequest;
  const shouldNotifyError = init?.notifyOnError ?? isActionRequest;

  if (shouldAttachJsonContentType && !hasHeader(headers, "content-type")) {
    headers["Content-Type"] = "application/json";
  }

  const config: AxiosRequestConfig = {
    url: path,
    method,
    data,
    params: init?.params,
    signal: init?.signal,
    headers
  };

  try {
    const response = await client.request<T>(config);
    if (shouldNotifySuccess) {
      notifyUiSuccess(resolveSuccessMessage(method, init?.successMessage));
    }
    return response.data;
  } catch (error) {
    const message = init?.errorMessage ?? resolveHttpErrorMessage(error);
    if (shouldNotifyError) {
      notifyUiError(message);
    }
    throw new Error(message);
  }
};
