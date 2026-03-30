import * as React from "react";
import { Button } from "../form/button";
import { cn } from "../../lib/utils";
export interface TablePaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  page: number;
  totalPages: number;
  totalCount?: number;
  onPageChange?: (nextPage: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
}
function TablePagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
  onPrev,
  onNext,
  className,
  ...props
}: TablePaginationProps) {
  const handlePrev = () => {
    if (onPageChange) {
      onPageChange(Math.max(page - 1, 1));
      return;
    }
    onPrev?.();
  };
  const handleNext = () => {
    if (onPageChange) {
      onPageChange(Math.min(page + 1, totalPages));
      return;
    }
    onNext?.();
  };
  return (
    <div
      className={cn(
        "border-default flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm",
        className
      )}
      {...props}
    >
      {typeof totalCount === "number" ? <p className="text-muted">총 {totalCount}건</p> : <span />}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handlePrev} disabled={page <= 1}>
          이전
        </Button>
        <span className="text-muted">
          {page} / {totalPages}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={handleNext} disabled={page >= totalPages}>
          다음
        </Button>
      </div>
    </div>
  );
}
export { TablePagination };
