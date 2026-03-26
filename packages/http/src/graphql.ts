import { createHttpClient } from "./http-client";
import { resolveHttpErrorMessage } from "./error";

type GraphqlError = { message?: string };
type GraphqlEnvelope<T> = {
  data?: T;
  errors?: GraphqlError[];
};

export const graphqlRequest = async <T>(
  apiUrl: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> => {
  const client = createHttpClient(apiUrl);

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

    return payload.data;
  } catch (error) {
    throw new Error(resolveHttpErrorMessage(error));
  }
};
