import * as React from "react";
import { cn } from "../../lib/utils";
type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";
const maxWidthMap: Record<ContainerSize, string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-none"
};
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  padded?: boolean;
}
const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "xl", padded = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mx-auto w-full", maxWidthMap[size], padded ? "px-4 md:px-6" : "", className)}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";
export { Container };
