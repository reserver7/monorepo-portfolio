"use client";

import { useMemo } from "react";
import { cn } from "../lib/utils";

const textareaBaseClassName =
  "flex min-h-20 w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:ring-offset-slate-950 dark:placeholder:text-slate-500";

export const useTextareaClassName = (className?: string): string => {
  return useMemo(() => cn(textareaBaseClassName, className), [className]);
};
