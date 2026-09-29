"use client";

import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Grid,
  Input,
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle
} from "@repo/ui";
import {
  getWorkspaceCommandResults,
  type WorkspaceItem,
  type WorkspaceItemKind
} from "@/features/workspace/model/workspace-items";

type WorkspaceCommandPaletteProps = {
  items: WorkspaceItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: WorkspaceItem) => void;
};

const itemLabel: Record<WorkspaceItemKind, string> = {
  all: "전체",
  document: "문서",
  board: "화이트보드"
};

export function WorkspaceCommandPalette({
  items,
  open,
  onOpenChange,
  onSelect
}: WorkspaceCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = getWorkspaceCommandResults(items, query);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const selectItem = (item: WorkspaceItem) => {
    onOpenChange(false);
    onSelect(item);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md" closeAriaLabel="검색 닫기">
        <ModalHeader>
          <ModalTitle>빠른 검색</ModalTitle>
          <ModalDescription>문서와 화이트보드를 검색하고 바로 이동하세요.</ModalDescription>
        </ModalHeader>
        <Input
          ref={inputRef}
          aria-label="문서와 화이트보드 검색"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
            }
            if (event.key === "Enter" && results[activeIndex]) {
              event.preventDefault();
              selectItem(results[activeIndex]);
            }
          }}
          placeholder="이름으로 검색"
          clearable
          onClear={() => setQuery("")}
        />
        <Grid className="mt-4 max-h-[min(55vh,28rem)] overflow-y-auto" gap="xs" role="listbox">
          {results.length > 0 ? (
            results.map((item, index) => (
              <Button
                key={`${item.kind}:${item.id}`}
                variant="text"
                fullWidth
                role="option"
                aria-selected={index === activeIndex}
                className={`justify-start rounded-xl px-3 py-3 text-left ${index === activeIndex ? "bg-primary/10" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectItem(item)}
              >
                <span className="min-w-0 flex-1 truncate">{item.title.trim() || "제목 없음"}</span>
                <Badge variant={item.kind === "document" ? "info" : "success"} size="sm">
                  {itemLabel[item.kind]}
                </Badge>
              </Button>
            ))
          ) : (
            <p className="text-muted px-3 py-8 text-center text-sm">검색 결과가 없습니다.</p>
          )}
        </Grid>
      </ModalContent>
    </Modal>
  );
}
