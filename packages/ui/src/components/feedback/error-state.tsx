import * as React from "react";
import { cn } from "../../lib/utils";
export interface ErrorStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}
function ErrorState({
  title = "데이터를 불러오지 못했습니다.",
  description = "잠시 후 다시 시도해 주세요.",
  action,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-rose-300/70 bg-rose-50/60 p-6 text-center dark:border-rose-700/60 dark:bg-rose-950/25",
        className
      )}
      {...props}
    >
      <div className="rounded-full border border-rose-300/80 bg-white p-2 text-rose-600 dark:border-rose-700/70 dark:bg-rose-950 dark:text-rose-300">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" /> <path d="m15 9-6 6" /> <path d="m9 9 6 6" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">{title}</p>
        {description ? <p className="text-xs text-rose-700 dark:text-rose-300">{description}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
export { ErrorState };
