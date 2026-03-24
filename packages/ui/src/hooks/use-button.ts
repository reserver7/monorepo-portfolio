"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useMemo } from "react";
import { cn } from "../lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950",
  {
    variants: {
      variant: {
        default: "bg-cyan-600 text-white hover:bg-cyan-500",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        outline:
          "border border-slate-300 bg-white/90 text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800",
        secondary:
          "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
        ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
        link: "text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export const useButtonClassName = ({
  variant,
  size,
  className
}: {
  variant?: ButtonVariantProps["variant"];
  size?: ButtonVariantProps["size"];
  className?: string;
}): string => {
  return useMemo(() => cn(buttonVariants({ variant, size, className })), [className, size, variant]);
};
