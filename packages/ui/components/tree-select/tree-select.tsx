"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../cn";
import { FieldSupportText } from "../field/field-utils";
import { Label } from "../label";
import type { TreeSelectNode, TreeSelectProps } from "./tree-select.types";

const flatten = (nodes: readonly TreeSelectNode[]): TreeSelectNode[] =>
  nodes.flatMap((node) => [node, ...(node.children ? flatten(node.children) : [])]);
const contains = (node: TreeSelectNode, query: string): boolean =>
  !query ||
  String(node.title).toLowerCase().includes(query) ||
  Boolean(node.children?.some((child) => contains(child, query)));

export function TreeSelect({
  treeData,
  value,
  defaultValue,
  onChange,
  multiple = false,
  treeCheckable = false,
  open,
  defaultOpen = false,
  onOpenChange,
  onClear,
  showSearch = false,
  allowClear = false,
  placeholder = "Select…",
  status = "default",
  size = "md",
  variant = "default",
  label,
  helperText,
  errorMessage,
  required,
  className,
  disabled,
  ...props
}: TreeSelectProps) {
  const multi = multiple || treeCheckable;
  const initial = defaultValue ?? (multi ? [] : "");
  const [uncontrolled, setUncontrolled] = React.useState<string | string[]>(initial);
  const current = value ?? uncontrolled;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState<readonly string[]>([]);
  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const selected = Array.isArray(current) ? current : current ? [current] : [];
  const allNodes = React.useMemo(() => flatten(treeData), [treeData]);
  const nodeByValue = React.useMemo(() => new Map(allNodes.map((node) => [node.value, node])), [allNodes]);
  const choose = (node: TreeSelectNode) => {
    if (node.disabled || node.selectable === false) return;
    const next = multi
      ? selected.includes(node.value)
        ? selected.filter((item) => item !== node.value)
        : [...selected, node.value]
      : node.value;
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
    if (!multi) setOpen(false);
  };
  const toggle = (node: TreeSelectNode) => {
    if (!node.children?.length) return;
    setExpanded((currentExpanded) =>
      currentExpanded.includes(node.value)
        ? currentExpanded.filter((key) => key !== node.value)
        : [...currentExpanded, node.value]
    );
  };
  const selectedText = selected
    .map((key) => nodeByValue.get(key)?.title)
    .filter(Boolean)
    .join(", ");
  const sizeClass = size === "sm" ? "h-8 text-sm" : size === "lg" ? "h-12" : "h-10";
  const statusClass =
    errorMessage || status === "error"
      ? "border-danger"
      : status === "warning"
        ? "border-warning"
        : "border-border";
  const renderNodes = (nodes: readonly TreeSelectNode[], level = 0): React.ReactNode =>
    nodes
      .filter((node) => contains(node, query.toLowerCase()))
      .map((node) => {
        const isExpanded = query ? true : expanded.includes(node.value);
        return (
          <React.Fragment key={node.value}>
            <div
              role="treeitem"
              aria-selected={selected.includes(node.value)}
              aria-expanded={node.children?.length ? isExpanded : undefined}
              className="flex items-center gap-1"
              style={{ paddingLeft: level * 16 }}
            >
              <button
                type="button"
                aria-label={isExpanded ? `Collapse ${String(node.title)}` : `Expand ${String(node.title)}`}
                className={cn(
                  "text-muted flex size-6 items-center justify-center",
                  !node.children?.length && "invisible"
                )}
                onClick={() => toggle(node)}
              >
                {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
              <button
                type="button"
                disabled={node.disabled}
                className={cn(
                  "hover:bg-surface-elevated flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-2 text-left text-sm disabled:opacity-50",
                  selected.includes(node.value) && "bg-surface-elevated text-primary"
                )}
                onClick={() => choose(node)}
              >
                {multi ? (
                  <input type="checkbox" tabIndex={-1} checked={selected.includes(node.value)} readOnly />
                ) : null}
                <span className="truncate">{node.title}</span>
              </button>
            </div>
            {node.children?.length && isExpanded ? (
              <div role="group">{renderNodes(node.children, level + 1)}</div>
            ) : null}
          </React.Fragment>
        );
      });
  return (
    <div className="relative grid w-full gap-1.5">
      {label ? (
        <Label size={size === "lg" ? "md" : "sm"} required={required}>
          {label}
        </Label>
      ) : null}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="tree"
          aria-expanded={isOpen}
          aria-invalid={Boolean(errorMessage || status === "error")}
          className={cn(
            "bg-surface focus-visible:ring-primary flex w-full items-center justify-between rounded-[var(--radius-md)] border px-3 text-left focus-visible:ring-2",
            sizeClass,
            statusClass,
            variant === "filled" && "bg-surface-elevated border-transparent",
            variant === "ghost" && "border-transparent bg-transparent",
            disabled && "opacity-50",
            className
          )}
          onClick={() => setOpen(!isOpen)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen(!isOpen);
            }
            if (event.key === "Escape" && isOpen) {
              event.preventDefault();
              setOpen(false);
            }
          }}
          {...props}
        >
          <span className={cn("min-w-0 truncate", !selectedText && "text-muted")}>
            {selectedText || placeholder}
          </span>
          <span aria-hidden>⌄</span>
        </button>
        {allowClear && selected.length ? (
          <button
            type="button"
            aria-label="Clear selection"
            disabled={disabled}
            onClick={() => {
              const next = multi ? [] : "";
              if (value === undefined) setUncontrolled(next);
              onChange?.(next);
              onClear?.();
            }}
            className="text-muted focus-visible:ring-primary absolute right-8 top-1/2 -translate-y-1/2 rounded focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
          >
            ×
          </button>
        ) : null}
        {isOpen ? (
          <div
            role="tree"
            className="border-border bg-surface absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-[var(--radius-md)] border p-1"
          >
            {showSearch ? (
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setOpen(false);
                  }
                }}
                placeholder="Search…"
                aria-label="Search tree options"
                className="border-border focus-visible:ring-primary mb-1 h-8 w-full rounded border bg-transparent px-2 text-sm outline-none focus-visible:ring-1"
              />
            ) : null}
            {renderNodes(treeData)}
            {!treeData.some((node) => contains(node, query.toLowerCase())) ? (
              <p role="status" className="text-muted px-3 py-2 text-sm">
                No data
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <FieldSupportText message={errorMessage ?? helperText} error={Boolean(errorMessage)} />
    </div>
  );
}
