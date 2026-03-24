"use client";

import { useMemo } from "react";
import { cn } from "../lib/utils";

const alertDialogOverlayBaseClassName = "fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[1px]";
const alertDialogContentBaseClassName =
  "fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const alertDialogHeaderBaseClassName = "flex flex-col space-y-2 text-center sm:text-left";
const alertDialogFooterBaseClassName = "mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end";
const alertDialogTitleBaseClassName = "text-lg font-semibold text-slate-900 dark:text-slate-100";
const alertDialogDescriptionBaseClassName = "text-sm text-slate-600 dark:text-slate-300";

export const useAlertDialogOverlayClassName = (className?: string): string => {
  return useMemo(() => cn(alertDialogOverlayBaseClassName, className), [className]);
};

export const useAlertDialogContentClassName = (className?: string): string => {
  return useMemo(() => cn(alertDialogContentBaseClassName, className), [className]);
};

export const useAlertDialogHeaderClassName = (className?: string): string => {
  return useMemo(() => cn(alertDialogHeaderBaseClassName, className), [className]);
};

export const useAlertDialogFooterClassName = (className?: string): string => {
  return useMemo(() => cn(alertDialogFooterBaseClassName, className), [className]);
};

export const useAlertDialogTitleClassName = (className?: string): string => {
  return useMemo(() => cn(alertDialogTitleBaseClassName, className), [className]);
};

export const useAlertDialogDescriptionClassName = (className?: string): string => {
  return useMemo(() => cn(alertDialogDescriptionBaseClassName, className), [className]);
};
