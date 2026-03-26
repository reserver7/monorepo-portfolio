import * as React from "react";
import { cn } from "../../lib/utils";
import { Spinner } from "../unit/spinner";
export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: React.ReactNode;
}
function LoadingState({ message = "데이터를 불러오는 중...", className, ...props }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "border-default bg-surface text-muted flex min-h-36 items-center justify-center gap-2 rounded-xl border p-6 text-sm",
        className
      )}
      {...props}
    >
      <Spinner className="text-muted-foreground h-4 w-4" /> <span>{message}</span>
    </div>
  );
}
export { LoadingState };
