import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white",
        secondary: "border-transparent bg-surface-elevated text-white ",
        outline: "text-muted "
      }
    },
    defaultVariants: { variant: "default" }
  }
);
export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, BadgeVariantProps {
  asChild?: boolean;
}
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return <Comp ref={ref} className={cn(badgeVariants({ variant, className }))} {...props} />;
  }
);
Badge.displayName = "Badge";
export { Badge };
