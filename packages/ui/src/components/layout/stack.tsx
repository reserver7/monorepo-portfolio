import * as React from "react";
import { cn } from "../../lib/utils";
type StackGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
const gapMap: Record<StackGap, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6"
};
export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: StackGap;
}
const Stack = React.forwardRef<HTMLDivElement, StackProps>(({ className, gap = "md", ...props }, ref) => {
  return <div ref={ref} className={cn("flex flex-col", gapMap[gap], className)} {...props} />;
});
Stack.displayName = "Stack";
export { Stack };
