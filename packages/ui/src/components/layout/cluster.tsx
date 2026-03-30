import * as React from "react";
import { cn } from "../../lib/utils";
type ClusterGap = "none" | "xs" | "sm" | "md" | "lg";
const gapMap: Record<ClusterGap, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4"
};
export interface ClusterProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: ClusterGap;
  align?: "start" | "center" | "end";
  justify?: "start" | "center" | "between" | "end";
}
const alignMap: Record<NonNullable<ClusterProps["align"]>, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end"
};
const justifyMap: Record<NonNullable<ClusterProps["justify"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  between: "justify-between",
  end: "justify-end"
};
const Cluster = React.forwardRef<HTMLDivElement, ClusterProps>(
  ({ className, gap = "sm", align = "center", justify = "start", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap", gapMap[gap], alignMap[align], justifyMap[justify], className)}
        {...props}
      />
    );
  }
);
Cluster.displayName = "Cluster";
export { Cluster };
