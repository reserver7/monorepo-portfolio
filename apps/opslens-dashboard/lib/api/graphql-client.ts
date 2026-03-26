import { graphqlRequest as requestGraphql } from "@repo/http";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100/graphql";

export async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  return requestGraphql<T>(API_URL, query, variables);
}
