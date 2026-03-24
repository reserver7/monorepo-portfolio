"use client";

import { useMemo } from "react";
import { cn } from "../lib/utils";

type SelectContentPosition = "item-aligned" | "popper";

export const SelectChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SelectChevronUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M18 15l-6-6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SelectCheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M20 6L9 17l-5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const selectTriggerBaseClassName =
  "flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 ring-offset-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:ring-offset-slate-950 dark:placeholder:text-slate-500";
const selectScrollButtonBaseClassName = "flex cursor-default items-center justify-center py-1";
const selectContentBaseClassName =
  "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900 shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const selectContentPopperClassName =
  "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1";
const selectViewportBaseClassName = "p-1";
const selectViewportPopperClassName =
  "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]";
const selectLabelBaseClassName = "px-2 py-1.5 text-sm font-semibold";
const selectItemBaseClassName =
  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-800";
const selectSeparatorBaseClassName = "-mx-1 my-1 h-px bg-slate-200 dark:bg-slate-700";

export const useSelectTriggerClassName = (className?: string): string => {
  return useMemo(() => cn(selectTriggerBaseClassName, className), [className]);
};

export const useSelectScrollButtonClassName = (className?: string): string => {
  return useMemo(() => cn(selectScrollButtonBaseClassName, className), [className]);
};

export const useSelectContentClassName = (
  className?: string,
  position: SelectContentPosition = "popper"
): string => {
  return useMemo(
    () => cn(selectContentBaseClassName, position === "popper" && selectContentPopperClassName, className),
    [className, position]
  );
};

export const useSelectViewportClassName = (position: SelectContentPosition = "popper"): string => {
  return useMemo(
    () => cn(selectViewportBaseClassName, position === "popper" && selectViewportPopperClassName),
    [position]
  );
};

export const useSelectLabelClassName = (className?: string): string => {
  return useMemo(() => cn(selectLabelBaseClassName, className), [className]);
};

export const useSelectItemClassName = (className?: string): string => {
  return useMemo(() => cn(selectItemBaseClassName, className), [className]);
};

export const useSelectSeparatorClassName = (className?: string): string => {
  return useMemo(() => cn(selectSeparatorBaseClassName, className), [className]);
};
