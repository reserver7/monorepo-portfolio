"use client";

import { cn } from "./cn";

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("bg-surface-elevated animate-pulse rounded-md", className)} />;
}
