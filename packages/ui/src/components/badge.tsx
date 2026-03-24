import * as React from "react";
import { BadgeVariantProps, badgeVariants, useBadgeClassName } from "../hooks/use-badge";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, BadgeVariantProps {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => {
  const resolvedClassName = useBadgeClassName({ variant, className });
  return <div ref={ref} className={resolvedClassName} {...props} />;
});

Badge.displayName = "Badge";

export { Badge, badgeVariants };
