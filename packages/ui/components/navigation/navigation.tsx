"use client";

import * as React from "react";
import { cn } from "../cn";

export type MenuItem = { key: string; label: React.ReactNode; disabled?: boolean };
export interface MenuProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange" | "onSelect"> {
  items: readonly MenuItem[];
  selectedKeys?: readonly string[];
  defaultSelectedKeys?: readonly string[];
  onSelect?: (key: string) => void;
  mode?: "horizontal" | "vertical" | "inline";
  multiple?: boolean;
  disabled?: boolean;
}
export function Menu({
  items,
  selectedKeys,
  defaultSelectedKeys = [],
  onSelect,
  mode = "vertical",
  multiple = false,
  disabled,
  className,
  ...props
}: MenuProps) {
  const [uncontrolled, setUncontrolled] = React.useState<readonly string[]>(defaultSelectedKeys);
  const selected = selectedKeys ?? uncontrolled;
  const navRef = React.useRef<HTMLElement>(null);
  const focusItem = (index: number) => {
    const buttons = navRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    buttons?.[Math.max(0, Math.min(index, buttons.length - 1))]?.focus();
  };
  return (
    <nav
      ref={navRef}
      aria-label="Menu"
      className={cn(
        "flex gap-1",
        mode === "vertical" && "flex-col",
        mode === "inline" && "border-border flex-col border-l",
        className
      )}
      {...props}
    >
      {items.map((item, index) => (
        <button
          type="button"
          key={item.key}
          disabled={disabled || item.disabled}
          aria-current={selected.includes(item.key) ? "page" : undefined}
          className={cn(
            "text-muted hover:bg-surface-elevated hover:text-foreground focus-visible:ring-primary rounded px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40",
            selected.includes(item.key) && "bg-primary/10 text-primary",
            mode === "horizontal" && "text-center"
          )}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowRight") {
              event.preventDefault();
              focusItem(index + 1);
            }
            if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
              event.preventDefault();
              focusItem(index - 1);
            }
            if (event.key === "Home") {
              event.preventDefault();
              focusItem(0);
            }
            if (event.key === "End") {
              event.preventDefault();
              focusItem(items.length - 1);
            }
          }}
          onClick={() => {
            const next = multiple
              ? selected.includes(item.key)
                ? selected.filter((key) => key !== item.key)
                : [...selected, item.key]
              : [item.key];
            if (selectedKeys === undefined) setUncontrolled(next);
            onSelect?.(item.key);
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export type BreadcrumbItem = { title: React.ReactNode; href?: string; onClick?: () => void };
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: readonly BreadcrumbItem[];
  separator?: React.ReactNode;
}
export function Breadcrumb({ items, separator = "/", className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center gap-2 text-sm", className)}
      {...props}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index ? (
              <li aria-hidden="true" className="text-muted">
                {separator}
              </li>
            ) : null}
            <li>
              {item.href ? (
                <a
                  href={item.href}
                  aria-current={index === items.length - 1 ? "page" : undefined}
                  onClick={item.onClick}
                  className="text-muted hover:text-foreground focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-2"
                >
                  {item.title}
                </a>
              ) : (
                <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.title}</span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}

export type AnchorItem = { key?: string; href: string; title: React.ReactNode };
export interface AnchorProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  items: readonly AnchorItem[];
  offsetTop?: number;
  onChange?: (current: string) => void;
}
export function Anchor({ items = [], offsetTop = 0, onChange, className, ...props }: AnchorProps) {
  const [active, setActive] = React.useState(items[0]?.href);
  return (
    <nav
      aria-label="On this page"
      className={cn("border-border grid min-w-0 gap-1 border-l pl-3", className)}
      {...props}
    >
      {items.map((item) => (
        <a
          key={item.key ?? item.href}
          href={item.href}
          aria-current={active === item.href ? "location" : undefined}
          onClick={(event) => {
            event.preventDefault();
            const target = document.querySelector(item.href);
            const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth";
            target?.scrollIntoView({ behavior, block: "start" });
            if (offsetTop && target) window.scrollTo({ top: window.scrollY - offsetTop, behavior });
            setActive(item.href);
            onChange?.(item.href);
          }}
          className={cn(
            "text-muted hover:text-foreground focus-visible:ring-primary break-words text-sm focus-visible:outline-none focus-visible:ring-2",
            active === item.href && "text-primary"
          )}
        >
          {item.title}
        </a>
      ))}
    </nav>
  );
}

export interface BackTopProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  visibilityHeight?: number;
  duration?: number;
}
export function BackTop({
  visibilityHeight = 400,
  duration = 300,
  className,
  children = "↑",
  onClick,
  ...props
}: BackTopProps) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY >= visibilityHeight);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [visibilityHeight]);
  if (!visible) return null;
  return (
    <button
      type="button"
      aria-label="Back to top"
      className={cn(
        "border-border bg-surface text-foreground focus-visible:ring-primary fixed bottom-6 right-6 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-lg focus-visible:outline-none focus-visible:ring-2",
        className
      )}
      onClick={(event) => {
        window.scrollTo({ top: 0, behavior: duration ? "smooth" : "auto" });
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export type StepItem = {
  title: React.ReactNode;
  description?: React.ReactNode;
  status?: "wait" | "process" | "finish" | "error";
  disabled?: boolean;
};
export interface StepsProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  items: readonly StepItem[];
  current?: number;
  initial?: number;
  onChange?: (current: number) => void;
  direction?: "horizontal" | "vertical";
  size?: "small" | "default";
  status?: "wait" | "process" | "finish" | "error";
}
export function Steps({
  items,
  current,
  initial = 0,
  onChange,
  direction = "horizontal",
  size = "default",
  status = "process",
  className,
  ...props
}: StepsProps) {
  const [uncontrolled, setUncontrolled] = React.useState(initial);
  const active = current ?? uncontrolled;
  return (
    <ol
      aria-label="Steps"
      className={cn(
        "flex",
        direction === "vertical" ? "flex-col gap-4" : "items-start",
        size === "small" && "text-sm",
        className
      )}
      {...props}
    >
      {items.map((item, index) => {
        const state = item.status ?? (index < active ? "finish" : index === active ? status : "wait");
        const isCurrent = index === active;
        return (
          <li
            key={index}
            className={cn("flex min-w-0 flex-1 gap-3", direction === "vertical" && "flex-none")}
          >
            <button
              type="button"
              disabled={item.disabled}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "focus-visible:ring-primary flex min-w-0 touch-manipulation gap-2 text-left focus-visible:outline-none focus-visible:ring-2",
                item.disabled && "cursor-not-allowed opacity-50"
              )}
              onClick={() => {
                if (current === undefined) setUncontrolled(index);
                onChange?.(index);
              }}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  state === "error" && "border-danger bg-danger text-danger-foreground",
                  isCurrent && state !== "error" && "border-primary bg-primary text-primary-foreground",
                  state === "finish" && !isCurrent && "border-border bg-surface-elevated text-text-secondary",
                  state === "wait" && "border-border text-text-tertiary"
                )}
              >
                {state === "finish" ? "✓" : index + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block break-words font-medium",
                    isCurrent ? "text-text-primary" : "text-text-secondary"
                  )}
                >
                  {item.title}
                </span>
                {item.description ? (
                  <span className="text-text-secondary mt-1 block break-words text-xs">
                    {item.description}
                  </span>
                ) : null}
              </span>
            </button>
            {index < items.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "bg-border mt-3 h-px flex-1",
                  direction === "vertical" && "hidden",
                  index < active && "bg-border"
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
