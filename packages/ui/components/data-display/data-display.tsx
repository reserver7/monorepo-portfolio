"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "../cn";
import { resolveSemanticTone, semanticIndicatorClass, semanticToneClass } from "../internal/semantic";
import type {
  DescriptionsProps,
  ListProps,
  StatisticProps,
  TagProps,
  TimelineProps
} from "./data-display.types";

export function List<T>({
  dataSource = [],
  renderItem,
  header,
  footer,
  bordered = false,
  split = true,
  loading = false,
  emptyText = "No data",
  className,
  ...props
}: ListProps<T>) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[var(--radius-md)]",
        bordered && "border-border-subtle border",
        className
      )}
      aria-busy={loading || undefined}
      {...props}
    >
      {header ? <div className="border-border-subtle border-b px-4 py-3 font-medium">{header}</div> : null}
      {loading ? (
        <div role="status" aria-live="polite" className="flex justify-center p-8">
          <Loader2 className="size-5 animate-spin" aria-label="Loading…" />
        </div>
      ) : dataSource.length ? (
        <ul>
          {dataSource.map((item, index) => (
            <li
              key={index}
              className={cn(
                "min-w-0 break-words px-4 py-3",
                split && index < dataSource.length - 1 && "border-border-subtle border-b"
              )}
            >
              {renderItem ? renderItem(item, index) : String(item)}
            </li>
          ))}
        </ul>
      ) : (
        <div role="status" aria-live="polite" className="text-text-secondary p-8 text-center text-sm">
          {emptyText}
        </div>
      )}
      {footer ? <div className="border-border-subtle border-t px-4 py-3">{footer}</div> : null}
    </div>
  );
}

export function Descriptions({
  items = [],
  title,
  bordered = false,
  column = 3,
  size = "default",
  layout = "horizontal",
  className,
  ...props
}: DescriptionsProps) {
  return (
    <section className={cn("space-y-3", className)} {...props}>
      {title ? <h3 className="text-text-primary font-semibold">{title}</h3> : null}
      <dl
        className={cn(
          "grid grid-cols-1",
          layout === "vertical"
            ? "gap-4"
            : "bg-border-subtle gap-px sm:[grid-template-columns:repeat(var(--description-columns),minmax(0,1fr))]",
          bordered && "border-border-subtle border"
        )}
        style={{ "--description-columns": Math.max(1, column) } as React.CSSProperties}
      >
        {items.map((item, index) => (
          <div
            key={item.key ?? index}
            className={cn(
              "min-w-0",
              layout === "vertical" ? "space-y-1" : "bg-surface px-4 py-3",
              size === "small" && "py-2 text-sm"
            )}
          >
            <dt className="text-text-secondary text-sm">{item.label}</dt>
            <dd className="text-text-primary mt-1 break-words text-sm">{item.children}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Statistic({
  title,
  value = 0,
  prefix,
  suffix,
  precision,
  formatter,
  loading = false,
  valueStyle,
  className,
  ...props
}: StatisticProps) {
  const formatted = formatter
    ? formatter(value)
    : typeof value === "number" && precision !== undefined
      ? value.toFixed(precision)
      : value;
  return (
    <div className={cn("space-y-1", className)} {...props}>
      <div className="text-text-secondary text-sm">{title}</div>
      {loading ? (
        <div className="bg-surface-muted h-8 w-24 animate-pulse rounded" aria-busy="true" />
      ) : (
        <div className="text-text-primary text-2xl font-semibold tabular-nums" style={valueStyle}>
          {prefix}
          {formatted}
          {suffix}
        </div>
      )}
    </div>
  );
}

export function Tag({
  color = "default",
  closable = false,
  closeIcon = <X className="size-3" />,
  onClose,
  className,
  children,
  ...props
}: TagProps) {
  const tone = resolveSemanticTone(color);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium",
        semanticToneClass[tone],
        className
      )}
      {...props}
    >
      <span className="min-w-0 break-words">{children}</span>
      {closable ? (
        <button
          type="button"
          aria-label="Close tag"
          className="focus-visible:ring-primary shrink-0 rounded-sm p-0.5 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2"
          onClick={onClose}
        >
          {closeIcon}
        </button>
      ) : null}
    </span>
  );
}

export function Timeline({
  items,
  mode = "left",
  pending,
  reverse = false,
  className,
  ...props
}: TimelineProps) {
  const rows = reverse ? [...items].reverse() : items;
  return (
    <ul className={cn("space-y-0", className)} {...props}>
      {rows.map((item, index) => {
        const tone = resolveSemanticTone(item.color);
        return (
          <li key={item.key ?? index} className="relative flex gap-3 pb-6 last:pb-0">
            <span className="relative flex w-3 shrink-0 justify-center">
              <span
                aria-hidden
                className={cn(
                  "ring-surface z-10 mt-1.5 flex size-2 rounded-full ring-4",
                  semanticIndicatorClass[tone]
                )}
              >
                {item.dot}
              </span>
              {index < rows.length - 1 || pending ? (
                <span aria-hidden className="bg-border-subtle absolute top-3 h-full w-px" />
              ) : null}
            </span>
            <div
              className={cn(
                "min-w-0 flex-1 text-sm",
                (mode === "right" || (mode === "alternate" && index % 2)) && "text-right"
              )}
            >
              {item.label ? <span className="text-text-secondary mr-2">{item.label}</span> : null}
              <span className="text-text-primary break-words">{item.children}</span>
            </div>
          </li>
        );
      })}
      {pending ? (
        <li className="text-text-secondary flex gap-3 text-sm">
          <span className="w-3" />
          {pending}
        </li>
      ) : null}
    </ul>
  );
}
