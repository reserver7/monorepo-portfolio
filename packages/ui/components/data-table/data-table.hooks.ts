import { useMemo } from "react";

export const useDataTablePageInfo = (page: number, totalPages: number, totalCount?: number) => {
  return useMemo(() => {
    const safePage = Math.max(1, page);
    const safeTotalPages = Math.max(1, totalPages);
    const canPrev = safePage > 1;
    const canNext = safePage < safeTotalPages;
    const label = `페이지 ${safePage} / ${safeTotalPages}${typeof totalCount === "number" ? ` · 총 ${totalCount}건` : ""}`;
    return { safePage, safeTotalPages, canPrev, canNext, label };
  }, [page, totalPages, totalCount]);
};
