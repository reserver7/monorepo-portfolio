import { createHttpClient } from "./http-client";
import { resolveHttpErrorMessage } from "./http-error";
import { notifyUiError, notifyUiSuccess } from "./notify";
import { ApiError } from "./api-error";

type GraphqlError = {
  message?: string;
  extensions?: { code?: string; params?: Record<string, string | number> };
};
type GraphqlEnvelope<T> = {
  data?: T;
  errors?: GraphqlError[];
};

export type GraphqlRequestOptions = {
  successMessage?: string;
  errorMessage?: string;
  notifyOnSuccess?: boolean;
  notifyOnError?: boolean;
};

export const graphqlRequest = async <T>(
  apiUrl: string,
  query: string,
  variables?: Record<string, unknown>,
  options?: GraphqlRequestOptions
): Promise<T> => {
  const client = createHttpClient(apiUrl);
  const operation = query.trim().toLowerCase();
  const isMutation = operation.startsWith("mutation");
  const shouldNotifySuccess = options?.notifyOnSuccess ?? isMutation;
  const shouldNotifyError = options?.notifyOnError ?? isMutation;

  try {
    const response = await client.post<GraphqlEnvelope<T>>(
      "",
      { query, variables },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const payload = response.data;
    if (payload.errors?.length) {
      const graphqlError = payload.errors[0];
      throw new ApiError(
        {
          code: graphqlError?.extensions?.code ?? "INTERNAL",
          params: graphqlError?.extensions?.params,
          message: graphqlError?.message
        },
        "GraphQL request failed"
      );
    }
    if (!payload.data) {
      throw new ApiError({ code: "INTERNAL" }, "Response data is missing");
    }

    if (shouldNotifySuccess) {
      notifyUiSuccess(options?.successMessage ?? "요청이 완료되었습니다.");
    }

    return payload.data;
  } catch (error) {
    const message = options?.errorMessage ?? resolveHttpErrorMessage(error);
    if (shouldNotifyError) {
      notifyUiError(message);
    }
    throw error instanceof ApiError ? error : new Error(message);
  }
};
