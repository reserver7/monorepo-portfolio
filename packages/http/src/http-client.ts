import axios, { AxiosError, AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { notifyHttpUnauthorized, resolveHttpAccessToken } from "./auth";

const clientRegistry = new Map<string, AxiosInstance>();

const DEFAULT_TIMEOUT_MS = 15_000;

type RequestConfigWithAuth = InternalAxiosRequestConfig;

const attachAuthHeader = (config: RequestConfigWithAuth): RequestConfigWithAuth => {
  const accessToken = resolveHttpAccessToken();
  if (!accessToken) {
    return config;
  }

  const headerValue = `Bearer ${accessToken}`;
  const headers = AxiosHeaders.from(config.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", headerValue);
  }
  config.headers = headers;

  return config;
};

const registerInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => attachAuthHeader(config as RequestConfigWithAuth));

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const requestConfig = error.config as RequestConfigWithAuth | undefined;
        if (status === 401) {
          notifyHttpUnauthorized({
            status,
            method: requestConfig?.method?.toUpperCase(),
            url: requestConfig?.url
          });
        }
      }

      return Promise.reject(error);
    }
  );
};

export const createHttpClient = (baseURL: string): AxiosInstance => {
  const cached = clientRegistry.get(baseURL);
  if (cached) {
    return cached;
  }

  const client = axios.create({
    baseURL,
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
      Accept: "application/json"
    }
  });
  registerInterceptors(client);

  clientRegistry.set(baseURL, client);
  return client;
};
