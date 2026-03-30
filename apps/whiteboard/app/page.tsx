"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RhfField, useAppForm } from "@repo/forms";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Spinner,
  StateView,
  Typography
} from "@repo/ui";
import { createBoard, deleteBoardById, listBoards, whiteboardQueryKeys } from "@/lib/http";
import { whiteboardClientEnv } from "@/lib/config";
import {
  createGuestName,
  getStoredDisplayName,
  getStoredRole,
  setStoredEditorAccessKey,
  setStoredDisplayName,
  setStoredRole
} from "@/lib/collab";
import { navigateToDocsApp } from "@/lib/navigation";
import { formatExactTime, formatRelativeTime } from "@/lib/collab";
import { coerceAccessRole, collabFieldCopy } from "@repo/utils/collab";

const EMPTY_TITLE = "(제목 없음)";

export default function WhiteboardHomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createForm = useAppForm<{
    displayName: string;
    boardTitle: string;
    role: "viewer" | "editor";
    editorAccessKey: string;
  }>({
    defaultValues: {
      displayName: "",
      boardTitle: "팀 아이디어 보드",
      role: whiteboardClientEnv.defaultRole,
      editorAccessKey: ""
    }
  });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const deleteForm = useAppForm<{ deleteAccessKeyDraft: string }>({
    defaultValues: { deleteAccessKeyDraft: "" }
  });
  const deleteAccessKeyDraft = deleteForm.watch("deleteAccessKeyDraft");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const deleteAccessKeyInputRef = useRef<HTMLInputElement | null>(null);
  const shouldPreserveAccessKeyForRoomRef = useRef(false);

  const clearMainEditorAccessKey = () => {
    shouldPreserveAccessKeyForRoomRef.current = false;
    createForm.setValue("editorAccessKey", "");
    setStoredEditorAccessKey("");
  };

  const keepAccessKeyForRoomEntry = (): string => {
    const normalizedAccessKey = (createForm.getValues("editorAccessKey") ?? "").trim();
    shouldPreserveAccessKeyForRoomRef.current = true;
    setStoredRole(createForm.getValues("role"));
    setStoredEditorAccessKey(normalizedAccessKey);
    return normalizedAccessKey;
  };

  useEffect(() => {
    const stored = getStoredDisplayName();
    const storedRole = getStoredRole();
    const fallback = createGuestName();
    const nextName = stored?.trim() ? stored : fallback;
    createForm.setValue("displayName", nextName);
    setStoredDisplayName(nextName);
    createForm.setValue("role", storedRole ?? whiteboardClientEnv.defaultRole);
    shouldPreserveAccessKeyForRoomRef.current = false;
    createForm.setValue("editorAccessKey", "");
    setStoredEditorAccessKey("");
  }, []);

  useEffect(() => {
    const handlePageHide = () => {
      if (shouldPreserveAccessKeyForRoomRef.current) {
        return;
      }

      setStoredEditorAccessKey("");
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      if (!shouldPreserveAccessKeyForRoomRef.current) {
        setStoredEditorAccessKey("");
      }
    };
  }, []);

  const boardsQuery = useQuery({
    queryKey: whiteboardQueryKeys.boards(),
    queryFn: listBoards,
    staleTime: 10 * 1000,
    refetchInterval: 5000
  });

  const createBoardMutation = useMutation({
    mutationFn: (input: { title: string; actor: string; editorAccessKey?: string }) => createBoard(input),
    onSuccess: async ({ board }) => {
      createForm.reset({
        displayName: createForm.getValues("displayName"),
        boardTitle: "팀 아이디어 보드",
        role: whiteboardClientEnv.defaultRole,
        editorAccessKey: ""
      });
      await queryClient.invalidateQueries({ queryKey: whiteboardQueryKeys.boards() });
      router.push(`/board/${board.id}`);
    },
    onError: () => {
      shouldPreserveAccessKeyForRoomRef.current = false;
    }
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (input: { boardId: string; editorAccessKey?: string }) => deleteBoardById(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: whiteboardQueryKeys.boards() });
      setDeleteTargetId(null);
      deleteForm.setValue("deleteAccessKeyDraft", "");
      setDeleteErrorMessage(null);
    },
    onError: (error) => {
      setDeleteErrorMessage(error instanceof Error ? error.message : "화이트보드 삭제에 실패했습니다.");
      deleteForm.setValue("deleteAccessKeyDraft", "");
      setTimeout(() => {
        deleteAccessKeyInputRef.current?.focus();
      }, 0);
    }
  });

  const boards = boardsQuery.data ?? [];
  const deleteTarget = boards.find((board) => board.id === deleteTargetId) ?? null;
  const isActionPending = createBoardMutation.isPending || deleteBoardMutation.isPending;
  const protectedBoardCount = boards.filter((board) => board.isProtected).length;
  const totalShapeCount = boards.reduce((total, board) => total + board.shapeCount, 0);

  useEffect(() => {
    if (!deleteTargetId || !deleteTarget?.isProtected) {
      return;
    }

    const timer = setTimeout(() => {
      deleteAccessKeyInputRef.current?.focus();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [deleteTargetId, deleteTarget?.isProtected]);

  const handleCreateBoard = (values: {
    displayName: string;
    boardTitle: string;
    role: "viewer" | "editor";
    editorAccessKey: string;
  }) => {
    setStoredDisplayName(values.displayName.trim() || createGuestName());
    setStoredRole(values.role);
    const normalizedAccessKey = keepAccessKeyForRoomEntry();
    createBoardMutation.mutate({
      title: values.boardTitle.trim() || EMPTY_TITLE,
      actor: values.displayName.trim() || createGuestName(),
      editorAccessKey: normalizedAccessKey || undefined
    });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-10">
      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Card className="p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant="success"
              size="lg"
              className="font-semibold uppercase tracking-[0.18em]"
            >
              Realtime Whiteboard
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearMainEditorAccessKey();
                navigateToDocsApp("/");
              }}
            >
              문서로 이동
            </Button>
          </div>
          <Typography as="h1" variant="h1">
            실시간 화이트보드 협업
          </Typography>
          <Typography as="p" variant="body" tone="muted" className="mt-3 max-w-2xl">
            도형 추가, 텍스트 입력, 드래그 이동, 참여자 커서 공유, undo/redo를 실시간 동기화로 제공합니다.
          </Typography>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div>
              <Label size="sm" className="mb-2 block">
                {collabFieldCopy.displayNameLabel}
              </Label>
              <RhfField
                control={createForm.control}
                name="displayName"
                render={({ field }) => (
                  <Input
                    title={collabFieldCopy.displayNameLabel}
                    value={field.value}
                    onChange={(event) => {
                      field.onChange(event.target.value);
                      setStoredDisplayName(event.target.value.trim() || createGuestName());
                    }}
                    placeholder={collabFieldCopy.displayNamePlaceholder}
                    size="md"
                  />
                )}
              />
            </div>
            <div>
              <Label size="sm" className="mb-2 block">
                새 보드 제목
              </Label>
              <RhfField
                control={createForm.control}
                name="boardTitle"
                render={({ field }) => (
                  <Input
                    title="새 보드 제목"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="보드 제목"
                    size="md"
                  />
                )}
              />
            </div>
            <div>
              <Label size="sm" className="mb-2 block">
                {collabFieldCopy.entryRoleLabel}
              </Label>
              <RhfField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      const nextRole = coerceAccessRole(value, whiteboardClientEnv.defaultRole);
                      field.onChange(nextRole);
                      setStoredRole(nextRole);
                    }}
                  >
                    <SelectTrigger title={collabFieldCopy.entryRoleLabel} size="md">
                      <SelectValue placeholder={collabFieldCopy.entryRolePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">{collabFieldCopy.roleOptionEditor}</SelectItem>
                      <SelectItem value="viewer">{collabFieldCopy.roleOptionViewer}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label size="sm" className="mb-2 block">
                {collabFieldCopy.editorAccessKeyLabel}
              </Label>
              <RhfField
                control={createForm.control}
                name="editorAccessKey"
                render={({ field }) => (
                  <Input
                    title={collabFieldCopy.editorAccessKeyLabel}
                    type="password"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={collabFieldCopy.editorAccessKeyPlaceholder}
                    size="md"
                  />
                )}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              size="lg"
              onClick={createForm.handleSubmit(handleCreateBoard)}
              loading={createBoardMutation.isPending ? true : undefined}
            >
              새 보드 만들기
            </Button>
          </div>
        </Card>

        <Card variant="elevated" className="p-6 md:p-8">
          <Typography as="h2" variant="h3">
            협업 보드 현황
          </Typography>
          <Typography as="p" variant="bodySm" tone="muted" className="mt-2">
            보드 생성/보호/도형 규모를 한눈에 확인하고 필요한 보드로 빠르게 이동하세요.
          </Typography>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Card className="p-3 text-center">
              <Typography as="p" variant="caption" tone="subtle">
                보드
              </Typography>
              <Typography as="p" variant="h3" className="mt-1">
                {boards.length}
              </Typography>
            </Card>
            <Card className="p-3 text-center">
              <Typography as="p" variant="caption" tone="subtle">
                보호됨
              </Typography>
              <Typography as="p" variant="h3" className="mt-1">
                {protectedBoardCount}
              </Typography>
            </Card>
            <Card className="p-3 text-center">
              <Typography as="p" variant="caption" tone="subtle">
                도형
              </Typography>
              <Typography as="p" variant="h3" className="mt-1">
                {totalShapeCount}
              </Typography>
            </Card>
          </div>
          <div className="mt-5 space-y-2 rounded-xl border border-default bg-surface p-3.5">
            <Typography as="p" variant="label" tone="subtle">
              사용 가이드
            </Typography>
            <Typography as="p" variant="bodySm" tone="muted">
              1) 보드 제목/권한을 설정하고 보드를 생성합니다.
            </Typography>
            <Typography as="p" variant="bodySm" tone="muted">
              2) 편집 키를 입력하면 보드 입장 시 기본으로 사용됩니다.
            </Typography>
            <Typography as="p" variant="bodySm" tone="muted">
              3) 삭제는 보드 카드에서 즉시 처리할 수 있습니다.
            </Typography>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <Typography as="h2" variant="h2" className="text-heading-xl">
            보드 목록
          </Typography>
          <Typography as="span" variant="bodySm" tone="subtle">
            자동 새로고침: 5초
          </Typography>
        </div>
        {boardsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={`board-loading-skeleton-${index}`} className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-6 w-2/5" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-3/4" />
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
        {boardsQuery.isError ? (
          <StateView variant="error" size="lg" title="보드 목록 조회에 실패했습니다." />
        ) : null}
        {!boardsQuery.isLoading && !boardsQuery.isError && boards.length === 0 ? (
          <StateView
            variant="empty"
            size="lg"
            title="아직 보드가 없습니다."
            description="첫 보드를 생성해보세요."
            className="mb-4"
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {boards.map((board) => (
            <Card key={board.id} interactive data-testid={`board-card-${board.id}`}>
              <CardHeader>
                <CardTitle>{board.title.trim() || EMPTY_TITLE}</CardTitle>
                <CardDescription>
                  도형 {board.shapeCount}개 · 버전 {board.version}
                  {board.isProtected ? " · 키 보호" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Typography as="p" variant="bodySm" tone="subtle" className="mb-4">
                  최근 수정: {formatRelativeTime(board.updatedAt)} ({formatExactTime(board.updatedAt)})
                </Typography>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="destructive"
                    data-testid={`board-delete-${board.id}`}
                    onClick={() => {
                      setDeleteTargetId(board.id);
                      deleteForm.setValue("deleteAccessKeyDraft", "");
                      setDeleteErrorMessage(null);
                    }}
                  >
                    삭제
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      keepAccessKeyForRoomEntry();
                      setStoredDisplayName(createForm.getValues("displayName").trim() || createGuestName());
                      createForm.setValue("editorAccessKey", "");
                      router.push(`/board/${board.id}`);
                    }}
                  >
                    보드 입장
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Dialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (open) {
            return;
          }

          setDeleteTargetId(null);
          deleteForm.setValue("deleteAccessKeyDraft", "");
          setDeleteErrorMessage(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>화이트보드를 삭제할까요?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.isProtected
                ? "이 화이트보드는 편집 키로 보호되어 있습니다. 삭제 비밀번호를 입력해 주세요."
                : "삭제된 화이트보드는 복구할 수 없습니다."}
            </DialogDescription>
          </DialogHeader>

          {deleteTarget?.isProtected ? (
            <RhfField
              control={deleteForm.control}
              name="deleteAccessKeyDraft"
              render={({ field }) => (
                <Input
                  ref={deleteAccessKeyInputRef}
                  type="password"
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event);
                    setDeleteErrorMessage(null);
                  }}
                  placeholder="삭제 비밀번호"
                  size="md"
                  state={deleteErrorMessage ? "error" : "default"}
                />
              )}
            />
          ) : null}

          {deleteErrorMessage ? (
            <Typography as="p" variant="bodySm" tone="danger">
              {deleteErrorMessage}
            </Typography>
          ) : null}

          <DialogFooter
            onCancel={() => {
              setDeleteTargetId(null);
              deleteForm.setValue("deleteAccessKeyDraft", "");
              setDeleteErrorMessage(null);
            }}
            confirmText="화이트보드 삭제"
            onConfirm={() => {
              if (!deleteTarget) {
                return;
              }

              deleteBoardMutation.mutate({
                boardId: deleteTarget.id,
                editorAccessKey: deleteTarget.isProtected ? deleteAccessKeyDraft.trim() : undefined
              });
            }}
            confirmDisabled={
              deleteBoardMutation.isPending ||
              !deleteTarget ||
              (deleteTarget.isProtected && deleteAccessKeyDraft.trim().length === 0)
            }
            confirmLoading={deleteBoardMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Spinner open={isActionPending} fullscreen size="lg" tone="primary" />
    </main>
  );
}
