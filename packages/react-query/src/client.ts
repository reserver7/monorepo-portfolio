import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";

const defaultQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
};

export const createAppQueryClient = (config?: QueryClientConfig) => {
  const queryDefaults = {
    ...defaultQueryClientConfig.defaultOptions?.queries,
    ...config?.defaultOptions?.queries
  };
  const mutationDefaults = {
    ...defaultQueryClientConfig.defaultOptions?.mutations,
    ...config?.defaultOptions?.mutations
  };

  return new QueryClient({
    ...defaultQueryClientConfig,
    ...config,
    defaultOptions: {
      ...defaultQueryClientConfig.defaultOptions,
      ...config?.defaultOptions,
      queries: queryDefaults,
      mutations: mutationDefaults
    }
  });
};
