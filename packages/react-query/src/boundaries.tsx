"use client";

import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

export const ContentErrorBoundary = ({ children }: React.PropsWithChildren) => {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-100">
          <span className="text-danger text-[4rem] font-bold">오류가 발생했습니다.</span>
          <button
            className="focus-visible:ring-ring bg-primary hover:bg-primary/80 inline-flex items-center justify-center whitespace-nowrap rounded-md p-[12px] font-bold text-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50"
            type="button"
            onClick={() => resetErrorBoundary()}
          >
            Retry
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
