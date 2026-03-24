"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useMemo } from "react";
import { cn } from "../lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-cyan-600 text-white",
        secondary: "border-transparent bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
        outline: "text-slate-700 dark:border-slate-700 dark:text-slate-200"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;

export const useBadgeClassName = ({
  variant,
  className
}: {
  variant?: BadgeVariantProps["variant"];
  className?: string;
}): string => {
  return useMemo(() => cn(badgeVariants({ variant, className })), [className, variant]);
};
