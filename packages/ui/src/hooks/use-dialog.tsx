"use client";

import { useMemo } from "react";
import { cn } from "../lib/utils";

export const DialogCloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const dialogOverlayBaseClassName = "fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[1px]";
const dialogContentBaseClassName =
  "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const dialogHeaderBaseClassName = "flex flex-col space-y-1.5 text-center sm:text-left";
const dialogFooterBaseClassName = "mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end";
const dialogTitleBaseClassName = "text-lg font-semibold leading-none";
const dialogDescriptionBaseClassName = "text-sm text-slate-600 dark:text-slate-300";
const dialogCloseButtonBaseClassName =
  "absolute right-4 top-4 rounded-sm text-slate-500 transition-colors hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:text-slate-400 dark:hover:text-slate-100";

export const useDialogOverlayClassName = (className?: string): string => {
  return useMemo(() => cn(dialogOverlayBaseClassName, className), [className]);
};

export const useDialogContentClassName = (className?: string): string => {
  return useMemo(() => cn(dialogContentBaseClassName, className), [className]);
};

export const useDialogHeaderClassName = (className?: string): string => {
  return useMemo(() => cn(dialogHeaderBaseClassName, className), [className]);
};

export const useDialogFooterClassName = (className?: string): string => {
  return useMemo(() => cn(dialogFooterBaseClassName, className), [className]);
};

export const useDialogTitleClassName = (className?: string): string => {
  return useMemo(() => cn(dialogTitleBaseClassName, className), [className]);
};

export const useDialogDescriptionClassName = (className?: string): string => {
  return useMemo(() => cn(dialogDescriptionBaseClassName, className), [className]);
};

export const useDialogCloseButtonClassName = (className?: string): string => {
  return useMemo(() => cn(dialogCloseButtonBaseClassName, className), [className]);
};
