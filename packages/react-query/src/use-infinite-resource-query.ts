import * as React from "react";
import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryResult
} from "@tanstack/react-query";

export type InfiniteResourcePage<TItem, TCursor = string | number | null> = {
  items: TItem[];
  nextCursor?: TCursor | null;
  totalCount?: number;
};

type InfiniteFetcher<TItem, TCursor> = (params: {
  cursor: TCursor | null;
  signal?: AbortSignal;
}) => Promise<InfiniteResourcePage<TItem, TCursor>>;

type InfiniteResourceQueryOptions<TItem, TCursor, TError> = {
  queryKey: QueryKey;
  queryFn: InfiniteFetcher<TItem, TCursor>;
  initialCursor?: TCursor | null;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean | "always";
  refetchOnReconnect?: boolean | "always";
  retry?: number | boolean | ((failureCount: number, error: TError) => boolean);
  retryDelay?: number | ((retryAttempt: number, error: TError) => number);
};

type InfiniteResourceQueryResult<TItem, TCursor, TError> = UseInfiniteQueryResult<
  InfiniteData<InfiniteResourcePage<TItem, TCursor>, TCursor | null>,
  TError
> & {
  items: TItem[];
  totalCount: number;
};

export const useInfiniteResourceQuery = <TItem, TCursor = string | number | null, TError = Error>({
  queryKey,
  queryFn,
  initialCursor = null,
  enabled,
  staleTime,
  gcTime,
  refetchOnWindowFocus,
  refetchOnReconnect,
  retry,
  retryDelay
}: InfiniteResourceQueryOptions<TItem, TCursor, TError>): InfiniteResourceQueryResult<TItem, TCursor, TError> => {
  const query = useInfiniteQuery<
    InfiniteResourcePage<TItem, TCursor>,
    TError,
    InfiniteData<InfiniteResourcePage<TItem, TCursor>, TCursor | null>,
    QueryKey,
    TCursor | null
  >({
    queryKey,
    initialPageParam: initialCursor,
    queryFn: ({ pageParam, signal }) => queryFn({ cursor: (pageParam ?? null) as TCursor | null, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    refetchOnReconnect,
    retry,
    retryDelay
  });

  const items = React.useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data?.pages]);

  const totalCount = query.data?.pages[0]?.totalCount ?? items.length;

  return {
    ...query,
    items,
    totalCount
  };
};
