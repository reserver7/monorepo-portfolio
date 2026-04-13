import type { QueryKey } from "@tanstack/react-query";

type QueryKeySegment = string | number | boolean | null | undefined | Record<string, unknown>;

type ListParams = Record<string, unknown>;
type DetailId = string | number;

export type QueryKeyFactory<TScope extends string = string> = {
  scope: TScope;
  all: readonly [TScope];
  lists: () => readonly [TScope, "list"];
  list: (params?: ListParams) => readonly [TScope, "list"] | readonly [TScope, "list", ListParams];
  details: () => readonly [TScope, "detail"];
  detail: <TId extends DetailId>(id: TId) => readonly [TScope, "detail", TId];
  custom: <TSegments extends readonly QueryKeySegment[]>(...segments: TSegments) => readonly [TScope, ...TSegments];
};

export const createQueryKeys = <TScope extends string>(scope: TScope): QueryKeyFactory<TScope> => {
  const all = [scope] as const;

  return {
    scope,
    all,
    lists: () => [...all, "list"] as const,
    list: (params?: ListParams) => (params ? [...all, "list", params] as const : [...all, "list"] as const),
    details: () => [...all, "detail"] as const,
    detail: <TId extends DetailId>(id: TId) => [...all, "detail", id] as const,
    custom: <TSegments extends readonly QueryKeySegment[]>(...segments: TSegments) => [...all, ...segments] as const
  };
};

export const asQueryKey = <TKey extends QueryKey>(key: TKey) => key;
