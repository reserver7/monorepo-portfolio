import type { AxiosRequestConfig, Method } from "axios";
import { createHttpClient } from "./http-client";
import { resolveHttpErrorMessage } from "./error";

type RequestBody = string | Record<string, unknown> | Array<unknown> | null | undefined;

export type RequestJsonInit = {
  method?: Method;
  headers?: Record<string, string | undefined>;
  body?: RequestBody;
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
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
    return response.data;
  } catch (error) {
    throw new Error(resolveHttpErrorMessage(error));
  }
};
