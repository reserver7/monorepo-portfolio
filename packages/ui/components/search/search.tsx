"use client";

import * as React from "react";
import { Search as SearchIcon } from "lucide-react";
import { useComposedRefs } from "../../hooks";
import { Input } from "../input";
import type { SearchProps } from "./search.types";

export const Search = React.forwardRef<HTMLInputElement, SearchProps>(function Search(
  { enterButton = false, loading = false, onSearch, onPressEnter, onKeyDown, ...props },
  ref
) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const composedRef = useComposedRefs(ref, inputRef);
  const submit = (value: string, event?: React.SyntheticEvent<HTMLInputElement>) => {
    if (!loading && !props.disabled) onSearch?.(value, event);
  };
  return (
    <Input
      ref={composedRef}
      {...props}
      type="search"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "Enter") {
          onPressEnter?.(event);
          submit(event.currentTarget.value, event);
        }
      }}
      suffix={
        enterButton ? (
          <button
            type="button"
            disabled={loading || props.disabled}
            aria-label="Search"
            onClick={() => submit(inputRef.current?.value ?? "")}
            className="bg-primary text-primary-foreground -mr-2 inline-flex h-full min-w-10 items-center justify-center px-3 disabled:opacity-50"
          >
            {loading ? (
              "…"
            ) : typeof enterButton === "boolean" ? (
              <SearchIcon aria-hidden className="h-4 w-4" />
            ) : (
              enterButton
            )}
          </button>
        ) : undefined
      }
    />
  );
});
Search.displayName = "Search";
