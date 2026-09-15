"use client";

import * as React from "react";
import { cn } from "../cn";
import type { TransferProps } from "./transfer.types";

export function Transfer({
  dataSource = [],
  targetKeys,
  defaultTargetKeys = [],
  onChange,
  showSearch = false,
  filterOption = (input, item) => String(item.title).toLowerCase().includes(input.toLowerCase()),
  titles = ["Source", "Target"],
  operations = ["→", "←"],
  oneWay = false,
  disabled,
  loading = false,
  notFoundContent = "No matching items",
  emptyContent = "No data",
  className,
  ...props
}: TransferProps) {
  const [uncontrolled, setUncontrolled] = React.useState<readonly string[]>(defaultTargetKeys);
  const current = targetKeys ?? uncontrolled;
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [query, setQuery] = React.useState(["", ""]);
  const update = (next: string[], direction: "left" | "right", moved: string[]) => {
    if (targetKeys === undefined) setUncontrolled(next);
    onChange?.(next, direction, moved);
    setSelected([]);
  };
  const lists = [
    dataSource.filter((item) => !current.includes(item.key)),
    dataSource.filter((item) => current.includes(item.key))
  ];
  const move = (direction: "left" | "right") => {
    const moved = selected.filter((key) =>
      direction === "right" ? !current.includes(key) : current.includes(key)
    );
    update(
      direction === "right" ? [...current, ...moved] : current.filter((key) => !moved.includes(key)),
      direction,
      moved
    );
  };
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)} {...props}>
      {lists.map((items, side) => {
        const filtered = items.filter((item) => !query[side] || filterOption(query[side], item));
        return (
          <React.Fragment key={side}>
            <section
              className="border-border bg-surface grid min-w-0 basis-full overflow-hidden rounded-[var(--radius-md)] border sm:min-w-56 sm:flex-1 sm:basis-auto"
              aria-label={String(titles[side])}
            >
              <h3 className="border-border border-b px-3 py-2 text-sm font-medium">
                {titles[side]} <span className="text-muted">({items.length})</span>
              </h3>
              {showSearch ? (
                <input
                  disabled={disabled || loading}
                  value={query[side]}
                  onChange={(event) =>
                    setQuery((currentQuery) =>
                      currentQuery.map((item, index) => (index === side ? event.target.value : item))
                    )
                  }
                  placeholder="Search…"
                  className="border-border focus-visible:ring-primary m-2 h-8 rounded border bg-transparent px-2 text-sm outline-none focus-visible:ring-2"
                />
              ) : null}
              <div role="listbox" aria-multiselectable="true" className="max-h-64 overflow-auto p-1">
                {loading ? (
                  <p role="status" aria-live="polite" className="text-text-secondary px-2 py-4 text-sm">
                    Loading…
                  </p>
                ) : (
                  filtered.map((item) => (
                    <label
                      key={item.key}
                      className="hover:bg-surface-elevated flex items-center gap-2 rounded px-2 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        disabled={disabled || loading || item.disabled}
                        checked={selected.includes(item.key)}
                        onChange={() =>
                          setSelected((currentSelected) =>
                            currentSelected.includes(item.key)
                              ? currentSelected.filter((key) => key !== item.key)
                              : [...currentSelected, item.key]
                          )
                        }
                      />{" "}
                      <span className="min-w-0 truncate">{item.title}</span>
                    </label>
                  ))
                )}
                {!loading && !items.length ? (
                  <p className="text-muted px-2 py-4 text-sm">{emptyContent}</p>
                ) : null}
                {!loading && items.length > 0 && !filtered.length ? (
                  <p className="text-muted px-2 py-4 text-sm">{notFoundContent}</p>
                ) : null}
              </div>
            </section>
            {side === 0 ? (
              <div className="flex shrink-0 flex-row gap-1 sm:flex-col">
                <button
                  type="button"
                  disabled={disabled || loading || !selected.some((key) => !current.includes(key))}
                  onClick={() => move("right")}
                  className="border-border focus-visible:ring-primary rounded border px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40"
                >
                  {operations[0]}
                </button>
                {!oneWay ? (
                  <button
                    type="button"
                    disabled={disabled || loading || !selected.some((key) => current.includes(key))}
                    onClick={() => move("left")}
                    className="border-border focus-visible:ring-primary rounded border px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40"
                  >
                    {operations[1]}
                  </button>
                ) : null}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
