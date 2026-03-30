import { createHttpClient } from "./http-client";
import { resolveHttpErrorMessage } from "./http-error";
import { notifyUiError, notifyUiSuccess } from "./notify";

type GraphqlError = { message?: string };
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
      throw new Error(payload.errors[0]?.message ?? "GraphQL 오류");
    }
    if (!payload.data) {
      throw new Error("응답 데이터가 없습니다.");
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
    throw new Error(message);
  }
};
