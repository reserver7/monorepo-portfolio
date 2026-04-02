"use client";

import { QueryClient, QueryClientProvider, type QueryClientConfig } from "@tanstack/react-query";
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";

const QUERY_CLIENT_DEFAULT_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000,
      retry: 0,
      refetchOnWindowFocus: false
    }
  }
};

export const createAppQueryClient = (config?: QueryClientConfig) => {
  const queryDefaults = {
    ...QUERY_CLIENT_DEFAULT_CONFIG.defaultOptions?.queries,
    ...config?.defaultOptions?.queries
  };
  const mutationDefaults = {
    ...QUERY_CLIENT_DEFAULT_CONFIG.defaultOptions?.mutations,
    ...config?.defaultOptions?.mutations
  };

  return new QueryClient({
    ...QUERY_CLIENT_DEFAULT_CONFIG,
    ...config,
    defaultOptions: {
      ...QUERY_CLIENT_DEFAULT_CONFIG.defaultOptions,
      ...config?.defaultOptions,
      queries: queryDefaults,
      mutations: mutationDefaults
    }
  });
};

const queryClient = createAppQueryClient();

export const ReactQueryProvider = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
    {/* <ReactQueryDevtools initialIsOpen={false} /> */}
  </QueryClientProvider>
);
