import { type UseQueryOptions, type QueryKey } from "@repo/react-query";
import { useMemo } from "react";

export type OpsQueryPreset = "default" | "list" | "detail";

const PRESET_STALE_TIME: Record<OpsQueryPreset, number> = {
  default: 10_000,
  list: 8_000,
  detail: 15_000
};

export function useOpsQueryOptions<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  preset: OpsQueryPreset,
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> {
  return useMemo(
    () => ({
      staleTime: PRESET_STALE_TIME[preset],
      refetchOnWindowFocus: false,
      ...options
    }),
    [preset, options]
  );
}
