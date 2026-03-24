"use client";

import { useMemo } from "react";
import { cn } from "../lib/utils";

const cardBaseClassName =
  "rounded-xl border border-slate-200 bg-white/85 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100";
const cardHeaderBaseClassName = "flex flex-col space-y-1.5 p-6";
const cardTitleBaseClassName = "text-lg font-semibold leading-none tracking-tight";
const cardDescriptionBaseClassName = "text-sm text-slate-600 dark:text-slate-300";
const cardContentBaseClassName = "p-6 pt-0";
const cardFooterBaseClassName = "flex items-center p-6 pt-0";

export const useCardClassName = (className?: string): string => {
  return useMemo(() => cn(cardBaseClassName, className), [className]);
};

export const useCardHeaderClassName = (className?: string): string => {
  return useMemo(() => cn(cardHeaderBaseClassName, className), [className]);
};

export const useCardTitleClassName = (className?: string): string => {
  return useMemo(() => cn(cardTitleBaseClassName, className), [className]);
};

export const useCardDescriptionClassName = (className?: string): string => {
  return useMemo(() => cn(cardDescriptionBaseClassName, className), [className]);
};

export const useCardContentClassName = (className?: string): string => {
  return useMemo(() => cn(cardContentBaseClassName, className), [className]);
};

export const useCardFooterClassName = (className?: string): string => {
  return useMemo(() => cn(cardFooterBaseClassName, className), [className]);
};
