"use client";

import { useMemo } from "react";
import { useOpsFilterStore } from "./use-ops-filter-store";

export function useOpsFilters() {
  const environment = useOpsFilterStore((state) => state.environment);
  const serviceName = useOpsFilterStore((state) => state.serviceName);
  const search = useOpsFilterStore((state) => state.search);
  const from = useOpsFilterStore((state) => state.from);
  const to = useOpsFilterStore((state) => state.to);

  return useMemo(
    () => ({
      environment,
      serviceName,
      search,
      from,
      to
    }),
    [environment, from, search, serviceName, to]
  );
}
