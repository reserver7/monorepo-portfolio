"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { notifyUiError, useMutation, useQuery, useQueryClient } from "@repo/react-query";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Select,
  Skeleton,
  Spinner,
  StateView,
  confirm,
  promptConfirm,
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

const resolveProtectedDeleteFieldError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "삭제 비밀번호를 확인해 주세요.";
  }

  const message = error.message.trim();
  if (message.length === 0) {
    return "삭제 비밀번호를 확인해 주세요.";
  }

  const normalized = message.toLowerCase();
  if (
    normalized.includes("비밀번호") ||
    normalized.includes("access key") ||
    normalized.includes("editor") ||
    normalized.includes("forbidden") ||
    normalized.includes("unauthorized") ||
    normalized.includes("403") ||
    normalized.includes("401")
  ) {
    return "삭제 비밀번호가 올바르지 않습니다.";
  }

  return message;
};

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
    mutationFn: (input: { boardId: string; editorAccessKey?: string; notifyOnError?: boolean }) =>
      deleteBoardById(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: whiteboardQueryKeys.boards() });
    }
  });

  const boards = boardsQuery.data ?? [];
  const isActionPending = createBoardMutation.isPending || deleteBoardMutation.isPending;
  const protectedBoardCount = boards.filter((board) => board.isProtected).length;
  const totalShapeCount = boards.reduce((total, board) => total + board.shapeCount, 0);

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
            <Badge variant="success" size="lg" className="font-semibold uppercase tracking-[0.18em]">
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
          <Typography as="p" variant="body" color="muted" className="mt-3 max-w-2xl">
            도형 추가, 텍스트 입력, 드래그 이동, 참여자 커서 공유, undo/redo를 실시간 동기화로 제공합니다.
          </Typography>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Input
              control={createForm.control}
              name="displayName"
              label={collabFieldCopy.displayNameLabel}
              onChange={(event) => {
                setStoredDisplayName(event.target.value.trim() || createGuestName());
              }}
              placeholder={collabFieldCopy.displayNamePlaceholder}
              size="md"
            />
            <Input
              control={createForm.control}
              name="boardTitle"
              label="새 보드 제목"
              placeholder="보드 제목"
              size="md"
            />
            <div>
              <Label size="sm" className="mb-2 block">
                {collabFieldCopy.entryRoleLabel}
              </Label>
              <Select
                control={createForm.control}
                name="role"
                options={[
                  { label: collabFieldCopy.roleOptionEditor, value: "editor" },
                  { label: collabFieldCopy.roleOptionViewer, value: "viewer" }
                ]}
                onChange={(value) => {
                  const nextRole = coerceAccessRole(String(value ?? ""), whiteboardClientEnv.defaultRole);
                  createForm.setValue("role", nextRole, { shouldDirty: true, shouldTouch: true });
                  setStoredRole(nextRole);
                }}
                placeholder={collabFieldCopy.entryRolePlaceholder}
                size="md"
              />
            </div>
            <Input
              control={createForm.control}
              name="editorAccessKey"
              data-testid="whiteboard-home-editor-access-key-input"
              label={collabFieldCopy.editorAccessKeyLabel}
              type="password"
              placeholder={collabFieldCopy.editorAccessKeyPlaceholder}
              size="md"
            />
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
          <Typography as="p" variant="bodySm" color="muted" className="mt-2">
            보드 생성/보호/도형 규모를 한눈에 확인하고 필요한 보드로 빠르게 이동하세요.
          </Typography>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Card className="p-3 text-center">
              <Typography as="p" variant="caption" color="subtle">
                보드
              </Typography>
              <Typography as="p" variant="h3" className="mt-1">
                {boards.length}
              </Typography>
            </Card>
            <Card className="p-3 text-center">
              <Typography as="p" variant="caption" color="subtle">
                보호됨
              </Typography>
              <Typography as="p" variant="h3" className="mt-1">
                {protectedBoardCount}
              </Typography>
            </Card>
            <Card className="p-3 text-center">
              <Typography as="p" variant="caption" color="subtle">
                도형
              </Typography>
              <Typography as="p" variant="h3" className="mt-1">
                {totalShapeCount}
              </Typography>
            </Card>
          </div>
          <div className="border-default bg-surface mt-5 space-y-2 rounded-xl border p-3.5">
            <Typography as="p" variant="label" color="subtle">
              사용 가이드
            </Typography>
            <Typography as="p" variant="bodySm" color="muted">
              1) 보드 제목/권한을 설정하고 보드를 생성합니다.
            </Typography>
            <Typography as="p" variant="bodySm" color="muted">
              2) 편집 키를 입력하면 보드 입장 시 기본으로 사용됩니다.
            </Typography>
            <Typography as="p" variant="bodySm" color="muted">
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
          <Typography as="span" variant="bodySm" color="subtle">
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
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : boardsQuery.isError ? (
          <StateView
            variant="error"
            size="lg"
            title="보드 목록 조회에 실패했습니다."
            description="서버 상태를 확인해 주세요."
          />
        ) : boards.length === 0 ? (
          <StateView
            variant="empty"
            size="lg"
            title="아직 보드가 없습니다."
            description="첫 보드를 생성해보세요."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {boards.map((board) => (
              <Card key={board.id} className="p-5" interactive data-testid={`board-card-${board.id}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <Typography as="h3" variant="h3" className="text-heading-lg">
                    {board.title.trim() || EMPTY_TITLE}
                  </Typography>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" size="sm">
                      v{board.version}
                    </Badge>
                    {board.isProtected ? (
                      <Badge variant="warning" size="sm">
                        키 보호
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <Typography as="p" variant="bodySm" color="subtle">
                    최근 수정: {formatRelativeTime(board.updatedAt)}
                  </Typography>
                  <Typography as="p" variant="bodySm" color="subtle">
                    수정 일시: {formatExactTime(board.updatedAt)}
                  </Typography>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="danger"
                    data-testid={`board-delete-${board.id}`}
                    onClick={async () => {
                      if (board.isProtected) {
                        const accessKey = await promptConfirm({
                          title: "화이트보드를 삭제할까요?",
                          description:
                            "이 화이트보드는 편집 키로 보호되어 있습니다. 삭제 비밀번호를 입력해 주세요.",
                          inputLabel: "삭제 비밀번호",
                          inputPlaceholder: "삭제 비밀번호",
                          inputType: "password",
                          confirmText: "화이트보드 삭제",
                          confirmVariant: "danger",
                          cancelText: "취소",
                          validator: (value) => {
                            if (value.trim().length === 0) {
                              return "삭제 비밀번호를 입력해 주세요.";
                            }
                            return null;
                          },
                          asyncValidator: async (value) => {
                            try {
                              await deleteBoardMutation.mutateAsync({
                                boardId: board.id,
                                editorAccessKey: value.trim(),
                                notifyOnError: false
                              });
                              return null;
                            } catch (error) {
                              notifyUiError("화이트보드 삭제에 실패했습니다.");
                              return resolveProtectedDeleteFieldError(error);
                            }
                          }
                        });
                        if (accessKey === null) {
                          return;
                        }
                        return;
                      }

                      const shouldDelete = await confirm({
                        title: "화이트보드를 삭제할까요?",
                        description: "삭제된 화이트보드는 복구할 수 없습니다.",
                        confirmText: "화이트보드 삭제",
                        confirmVariant: "danger",
                        cancelText: "취소"
                      });

                      if (!shouldDelete) {
                        return;
                      }

                      try {
                        await deleteBoardMutation.mutateAsync({
                          boardId: board.id
                        });
                      } catch {
                        // requestJson에서 토스트를 처리하므로 여기서는 추가 알림을 띄우지 않습니다.
                      }
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
              </Card>
            ))}
          </div>
        )}
      </section>

      <Spinner open={isActionPending} fullscreen size="lg" color="primary" />
    </main>
  );
}
