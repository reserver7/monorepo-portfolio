"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../cn";
import type { TreeNode, TreeProps } from "./tree.types";

export function Tree({
  treeData,
  selectedKeys,
  defaultSelectedKeys = [],
  expandedKeys,
  defaultExpandedKeys = [],
  onSelect,
  onExpand,
  checkable = false,
  checkedKeys,
  defaultCheckedKeys = [],
  onCheck,
  multiple = false,
  className,
  ...props
}: TreeProps) {
  const [selected, setSelected] = React.useState<readonly string[]>(defaultSelectedKeys);
  const [expanded, setExpanded] = React.useState<readonly string[]>(defaultExpandedKeys);
  const [checked, setChecked] = React.useState<readonly string[]>(defaultCheckedKeys);
  const select = (node: TreeNode) => {
    if (node.disabled || node.selectable === false) return;
    const current = selectedKeys ?? selected;
    const next = multiple
      ? current.includes(node.key)
        ? current.filter((key) => key !== node.key)
        : [...current, node.key]
      : [node.key];
    if (selectedKeys === undefined) setSelected(next);
    onSelect?.(next, { node });
  };
  const toggleExpand = (node: TreeNode) => {
    if (!node.children?.length) return;
    const current = expandedKeys ?? expanded;
    const next = current.includes(node.key)
      ? current.filter((key) => key !== node.key)
      : [...current, node.key];
    if (expandedKeys === undefined) setExpanded(next);
    onExpand?.(next);
  };
  const toggleCheck = (node: TreeNode) => {
    if (node.disabled) return;
    const current = checkedKeys ?? checked;
    const next = current.includes(node.key)
      ? current.filter((key) => key !== node.key)
      : [...current, node.key];
    if (checkedKeys === undefined) setChecked(next);
    onCheck?.(next, { node });
  };
  const renderNodes = (nodes: readonly TreeNode[], level = 0): React.ReactNode =>
    nodes.map((node) => {
      const isExpanded = (expandedKeys ?? expanded).includes(node.key);
      const isSelected = (selectedKeys ?? selected).includes(node.key);
      const isChecked = (checkedKeys ?? checked).includes(node.key);
      return (
        <li
          key={node.key}
          role="treeitem"
          aria-expanded={node.children?.length ? isExpanded : undefined}
          aria-selected={isSelected}
          aria-level={level + 1}
          className="select-none"
        >
          <div className="flex items-center gap-1" style={{ paddingLeft: level * 16 }}>
            <button
              type="button"
              aria-label={isExpanded ? `Collapse ${String(node.title)}` : `Expand ${String(node.title)}`}
              className={cn(
                "text-text-tertiary focus-visible:ring-primary flex size-6 items-center justify-center focus-visible:outline-none focus-visible:ring-2",
                !node.children?.length && "invisible"
              )}
              onClick={() => toggleExpand(node)}
            >
              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
            {checkable ? (
              <input
                type="checkbox"
                checked={isChecked}
                disabled={node.disabled}
                aria-label={`Select ${String(node.title)}`}
                onChange={() => toggleCheck(node)}
              />
            ) : null}
            <button
              type="button"
              disabled={node.disabled}
              className={cn(
                "text-text-primary hover:bg-surface-muted focus-visible:ring-primary flex-1 rounded px-2 py-1.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
                isSelected && "bg-primary/10 text-primary"
              )}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" && node.children?.length && !isExpanded) {
                  event.preventDefault();
                  toggleExpand(node);
                }
                if (event.key === "ArrowLeft" && node.children?.length && isExpanded) {
                  event.preventDefault();
                  toggleExpand(node);
                }
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  select(node);
                }
              }}
              onClick={() => select(node)}
            >
              {node.title}
            </button>
          </div>
          {node.children?.length && isExpanded ? (
            <ul role="group">{renderNodes(node.children, level + 1)}</ul>
          ) : null}
        </li>
      );
    });
  return (
    <ul role="tree" className={cn("grid gap-0.5", className)} {...props}>
      {renderNodes(treeData)}
    </ul>
  );
}
