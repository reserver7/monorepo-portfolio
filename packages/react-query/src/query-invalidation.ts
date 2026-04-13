import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { QueryKeyFactory } from "./query-keys";

type InvalidateOptions = {
  refetchType?: "active" | "all" | "inactive" | "none";
  exact?: boolean;
};

export const invalidateQueryKeys = async (
  queryClient: QueryClient,
  queryKeys: readonly QueryKey[],
  options?: InvalidateOptions
) => {
  await Promise.all(
    queryKeys.map((queryKey) =>
      queryClient.invalidateQueries({
        queryKey,
        refetchType: options?.refetchType ?? "active",
        exact: options?.exact ?? false
      })
    )
  );
};

type InvalidateFactoryTarget = "all" | "lists" | "details" | "detail";

type InvalidateFactoryOptions = InvalidateOptions & {
  target?: InvalidateFactoryTarget;
  detailId?: string | number;
};

export const invalidateFromFactory = async (
  queryClient: QueryClient,
  factory: QueryKeyFactory,
  options?: InvalidateFactoryOptions
) => {
  const target = options?.target ?? "all";

  if (target === "detail") {
    if (options?.detailId === undefined) {
      throw new Error("invalidateFromFactory: target이 detail인 경우 detailId가 필요합니다.");
    }

    return invalidateQueryKeys(queryClient, [factory.detail(options.detailId)], options);
  }

  if (target === "lists") {
    return invalidateQueryKeys(queryClient, [factory.lists()], options);
  }

  if (target === "details") {
    return invalidateQueryKeys(queryClient, [factory.details()], options);
  }

  return invalidateQueryKeys(queryClient, [factory.all], options);
};
