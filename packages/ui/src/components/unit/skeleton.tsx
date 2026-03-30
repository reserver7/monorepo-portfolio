import * as React from "react";
import { cn } from "../../lib/utils";
export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;
function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("bg-surface-elevated animate-pulse rounded-md", className)} {...props} />;
}
export { Skeleton };
