import axios, { AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { notifyHttpUnauthorized, resolveHttpAccessToken } from "./http-auth";

const clientRegistry = new Map<string, AxiosInstance>();

const DEFAULT_TIMEOUT_MS = 15_000;

type RequestConfigWithAuth = InternalAxiosRequestConfig;

const registerInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    const headers = AxiosHeaders.from(config.headers);
    const accessToken = resolveHttpAccessToken();
    if (accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    config.headers = headers;
    return config as RequestConfigWithAuth;
  });
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        notifyHttpUnauthorized({
          status: 401,
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url
        });
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
