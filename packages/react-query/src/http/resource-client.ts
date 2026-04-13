import { requestJson, type RequestJsonInit } from "./request-json";

type ResourceCreatePayload = {
  title: string;
  actor: string;
  editorAccessKey?: string;
};

type ResourceDeletePayload = {
  editorAccessKey?: string;
};

type ResourceRequestOptions = Pick<
  RequestJsonInit,
  "headers" | "params" | "signal" | "successMessage" | "errorMessage" | "notifyOnSuccess" | "notifyOnError"
>;

const normalizePath = (path: string) => path.replace(/\/+$/, "");

export const createResourceClient = <
  TSummary,
  TRecord,
  TListKey extends string = string,
  TItemKey extends string = string,
  TDeleteIdKey extends string = string
>(
  apiBaseUrl: string,
  resourcePath: string,
  keys: {
    list: TListKey;
    item: TItemKey;
    deleteId: TDeleteIdKey;
  }
) => {
  const basePath = normalizePath(resourcePath);

  return {
    list: async (): Promise<Array<TSummary>> => {
      const payload = await requestJson<Record<TListKey, Array<TSummary>>>(apiBaseUrl, basePath, {
        method: "GET"
      });
      return payload[keys.list] ?? [];
    },

    create: async (
      input: ResourceCreatePayload,
      options?: ResourceRequestOptions
    ): Promise<Record<TItemKey, TRecord>> => {
      return requestJson<Record<TItemKey, TRecord>>(apiBaseUrl, basePath, {
        method: "POST",
        body: JSON.stringify(input),
        ...options
      });
    },

    deleteById: async (
      resourceId: string,
      input?: ResourceDeletePayload,
      options?: ResourceRequestOptions
    ): Promise<{ ok: true } & Record<TDeleteIdKey, string>> => {
      return requestJson<{ ok: true } & Record<TDeleteIdKey, string>>(
        apiBaseUrl,
        `${basePath}/${resourceId}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            editorAccessKey: input?.editorAccessKey
          }),
          ...options
        }
      );
    },

    getById: async (resourceId: string): Promise<Record<TItemKey, TRecord>> => {
      return requestJson<Record<TItemKey, TRecord>>(apiBaseUrl, `${basePath}/${resourceId}`, {
        method: "GET"
      });
    }
  };
};
