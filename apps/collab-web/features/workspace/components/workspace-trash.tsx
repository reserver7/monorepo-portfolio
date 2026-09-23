"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { Badge, Button, Card, Typography, confirm, Flex, Grid } from "@repo/ui";
import { docsQueryKeys } from "@/features/docs/documents/api";
import { whiteboardQueryKeys } from "@/features/whiteboard/boards/api";
import { listTrash, permanentlyDeleteTrashItem, restoreTrashItem } from "../api/trash-api";

const trashQueryKey = ["collab", "workspace-trash"];

export function WorkspaceTrash() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const trashQuery = useQuery({ queryKey: trashQueryKey, queryFn: listTrash });
  const restoreMutation = useMutation({
    mutationFn: restoreTrashItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trashQueryKey });
      await queryClient.invalidateQueries({ queryKey: docsQueryKeys.documents() });
      await queryClient.invalidateQueries({ queryKey: whiteboardQueryKeys.boards() });
    }
  });
  const permanentDeleteMutation = useMutation({
    mutationFn: permanentlyDeleteTrashItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trashQueryKey });
    }
  });

  const items = [
    ...(trashQuery.data?.documents ?? []).map((item) => ({ ...item, kind: "document" as const })),
    ...(trashQuery.data?.boards ?? []).map((item) => ({ ...item, kind: "board" as const }))
  ];

  const runAction = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "휴지통 작업에 실패했습니다.");
    }
  };

  return (
    <section className="border-default bg-surface mb-6 rounded-2xl border p-5 shadow-[var(--shadow-card)]">
      <Flex className="flex items-center justify-between gap-3">
        <div>
          <Typography as="h2" variant="headingMd">
            휴지통
          </Typography>
          <Typography as="p" variant="bodySm" color="muted" className="mt-1">
            삭제된 문서와 화이트보드를 복구하거나 영구 삭제할 수 있습니다.
          </Typography>
        </div>
        {items.length > 0 ? <Badge variant="secondary">{items.length}</Badge> : null}
      </Flex>

      {error ? (
        <Typography as="p" variant="bodySm" color="danger" className="mt-3">
          {error}
        </Typography>
      ) : null}

      {trashQuery.isLoading ? (
        <Typography as="p" variant="bodySm" color="muted" className="mt-4">
          휴지통을 불러오는 중입니다.
        </Typography>
      ) : items.length === 0 ? (
        <Typography as="p" variant="bodySm" color="muted" className="mt-4">
          휴지통이 비어 있습니다.
        </Typography>
      ) : (
        <Grid className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <Card
              key={`${item.kind}:${item.id}`}
              className="border-default/70 bg-surface-elevated border p-4"
              radius="md"
            >
              <Flex className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Typography as="h3" variant="title" className="truncate">
                    {item.title}
                  </Typography>
                  <Typography as="p" variant="bodySm" color="muted" className="mt-1">
                    {item.kind === "document" ? "문서" : "화이트보드"} · 삭제됨{" "}
                    {formatDeletedAt(item.deletedAt)}
                  </Typography>
                </div>
                <Badge variant="outline">삭제됨</Badge>
              </Flex>
              <Flex className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={restoreMutation.isPending || permanentDeleteMutation.isPending}
                  onClick={() =>
                    void runAction(() => restoreMutation.mutateAsync({ kind: item.kind, id: item.id }))
                  }
                >
                  복구
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={restoreMutation.isPending || permanentDeleteMutation.isPending}
                  onClick={() =>
                    void runAction(async () => {
                      if (
                        await confirm({
                          title: "영구 삭제할까요?",
                          description: "영구 삭제한 작업 공간은 복구할 수 없습니다.",
                          confirmText: "영구 삭제",
                          confirmVariant: "danger",
                          cancelText: "취소"
                        })
                      ) {
                        await permanentDeleteMutation.mutateAsync({ kind: item.kind, id: item.id });
                      }
                    })
                  }
                >
                  영구 삭제
                </Button>
              </Flex>
            </Card>
          ))}
        </Grid>
      )}
    </section>
  );
}

const formatDeletedAt = (value: string | undefined) =>
  value ? new Date(value).toLocaleString("ko-KR") : "알 수 없음";
