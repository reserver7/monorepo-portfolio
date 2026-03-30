import { graphqlRequest as requestGraphql } from "@repo/react-query";
import type { GraphqlRequestOptions } from "@repo/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100/graphql";

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: GraphqlRequestOptions
): Promise<T> {
  return requestGraphql<T>(API_URL, query, variables, options);
}
