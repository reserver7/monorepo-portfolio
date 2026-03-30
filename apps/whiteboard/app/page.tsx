"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Typography
} from "@repo/ui";
import { createBoard, deleteBoardById, listBoards } from "@/lib/http";
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
import { coerceAccessRole, collabFieldCopy } from "@repo/collab-client";

const EMPTY_TITLE = "(제목 없음)";

export default function WhiteboardHomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [boardTitle, setBoardTitle] = useState("팀 아이디어 보드");
  const [role, setRole] = useState<"viewer" | "editor">(whiteboardClientEnv.defaultRole);
  const [editorAccessKey, setEditorAccessKey] = useState<string>("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteAccessKeyDraft, setDeleteAccessKeyDraft] = useState<string>("");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const deleteAccessKeyInputRef = useRef<HTMLInputElement | null>(null);
  const shouldPreserveAccessKeyForRoomRef = useRef(false);

  const clearMainEditorAccessKey = () => {
    shouldPreserveAccessKeyForRoomRef.current = false;
    setEditorAccessKey("");
    setStoredEditorAccessKey("");
  };

  const keepAccessKeyForRoomEntry = (): string => {
    const normalizedAccessKey = editorAccessKey.trim();
    shouldPreserveAccessKeyForRoomRef.current = true;
    setStoredRole(role);
    setStoredEditorAccessKey(normalizedAccessKey);
    return normalizedAccessKey;
  };

  useEffect(() => {
    const stored = getStoredDisplayName();
    const storedRole = getStoredRole();
    const fallback = createGuestName();
    const nextName = stored?.trim() ? stored : fallback;
    setDisplayName(nextName);
    setStoredDisplayName(nextName);
    setRole(storedRole ?? whiteboardClientEnv.defaultRole);
    shouldPreserveAccessKeyForRoomRef.current = false;
    setEditorAccessKey("");
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
    queryKey: ["boards"],
    queryFn: listBoards,
    staleTime: 5000,
    refetchInterval: 5000
  });

  const createBoardMutation = useMutation({
    mutationFn: (input: { title: string; actor: string; editorAccessKey?: string }) => createBoard(input),
    onSuccess: async ({ board }) => {
      setBoardTitle("팀 아이디어 보드");
      setRole(whiteboardClientEnv.defaultRole);
      setEditorAccessKey("");
      await queryClient.invalidateQueries({ queryKey: ["boards"] });
      router.push(`/board/${board.id}`);
    },
    onError: () => {
      shouldPreserveAccessKeyForRoomRef.current = false;
    }
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (input: { boardId: string; editorAccessKey?: string }) => deleteBoardById(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["boards"] });
      setDeleteTargetId(null);
      setDeleteAccessKeyDraft("");
      setDeleteErrorMessage(null);
    },
    onError: (error) => {
      setDeleteErrorMessage(error instanceof Error ? error.message : "화이트보드 삭제에 실패했습니다.");
      setDeleteAccessKeyDraft("");
      setTimeout(() => {
        deleteAccessKeyInputRef.current?.focus();
      }, 0);
    }
  });

  const boards = boardsQuery.data ?? [];
  const deleteTarget = boards.find((board) => board.id === deleteTargetId) ?? null;

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

  const handleCreateBoard = () => {
    const normalizedAccessKey = keepAccessKeyForRoomEntry();
    createBoardMutation.mutate({
      title: boardTitle.trim() || EMPTY_TITLE,
      actor: displayName.trim() || createGuestName(),
      editorAccessKey: normalizedAccessKey || undefined
    });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 md:px-8">
      <section className="mb-8 rounded-2xl border border-default/80 bg-gradient-to-b from-surface/95 to-surface-elevated/80 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-10 dark:border-default dark:from-surface/95 dark:to-surface-elevated/80 dark:shadow-[0_20px_45px_rgba(2,6,23,0.42)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Badge
            variant="outline"
            className="border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-success"
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
        <Typography as="h1" variant="display">
          실시간 화이트보드 협업
        </Typography>
        <Typography as="p" variant="lead" className="mt-3 max-w-2xl">
          도형 추가, 텍스트 입력, 드래그 이동, 참여자 커서 공유, undo/redo를 실시간 동기화로 제공합니다.
        </Typography>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_220px_220px_auto]">
          <div>
            <p className="mb-2 text-xs font-medium text-muted">{collabFieldCopy.displayNameLabel}</p>
            <Input
              title={collabFieldCopy.displayNameLabel}
              value={displayName}
              onChange={(event) => {
                const next = event.target.value;
                setDisplayName(next);
                setStoredDisplayName(next.trim() || createGuestName());
              }}
              placeholder={collabFieldCopy.displayNamePlaceholder}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted">새 보드 제목</p>
            <Input
              title="새 보드 제목"
              value={boardTitle}
              onChange={(event) => setBoardTitle(event.target.value)}
              placeholder="보드 제목"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted">{collabFieldCopy.entryRoleLabel}</p>
            <Select
              value={role}
              onValueChange={(value) => {
                const nextRole = coerceAccessRole(value, whiteboardClientEnv.defaultRole);
                setRole(nextRole);
                setStoredRole(nextRole);
              }}
            >
              <SelectTrigger title={collabFieldCopy.entryRoleLabel}>
                <SelectValue placeholder={collabFieldCopy.entryRolePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">{collabFieldCopy.roleOptionEditor}</SelectItem>
                <SelectItem value="viewer">{collabFieldCopy.roleOptionViewer}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted">
              {collabFieldCopy.editorAccessKeyLabel} (보드별 설정/입장 기본값)
            </p>
            <Input
              title={collabFieldCopy.editorAccessKeyLabel}
              type="password"
              value={editorAccessKey}
              onChange={(event) => {
                const nextValue = event.target.value;
                setEditorAccessKey(nextValue);
              }}
              placeholder={collabFieldCopy.editorAccessKeyPlaceholder}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreateBoard} disabled={createBoardMutation.isPending}>
              {createBoardMutation.isPending ? "생성 중..." : "새 보드 만들기"}
            </Button>
          </div>
        </div>
      </section>

      <section>
        <Typography as="h2" variant="h2" className="mb-4 text-heading-xl">
          보드 목록
        </Typography>
        {boardsQuery.isLoading ? <Card className="p-4 text-sm">불러오는 중...</Card> : null}
        {boardsQuery.isError ? <Card className="p-4 text-sm text-danger">보드 목록 조회 실패</Card> : null}

        <div className="grid gap-4 md:grid-cols-2">
          {boards.map((board) => (
            <Card key={board.id} data-testid={`board-card-${board.id}`}>
              <CardHeader>
                <CardTitle>{board.title.trim() || EMPTY_TITLE}</CardTitle>
                <CardDescription>
                  도형 {board.shapeCount}개 · 버전 {board.version}
                  {board.isProtected ? " · 키 보호" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-xs text-muted-foreground">
                  최근 수정: {formatRelativeTime(board.updatedAt)} ({formatExactTime(board.updatedAt)})
                </p>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="destructive"
                    data-testid={`board-delete-${board.id}`}
                    onClick={() => {
                      setDeleteTargetId(board.id);
                      setDeleteAccessKeyDraft("");
                      setDeleteErrorMessage(null);
                    }}
                  >
                    삭제
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      keepAccessKeyForRoomEntry();
                      setStoredDisplayName(displayName.trim() || createGuestName());
                      setEditorAccessKey("");
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
          setDeleteAccessKeyDraft("");
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
            <Input
              ref={deleteAccessKeyInputRef}
              type="password"
              value={deleteAccessKeyDraft}
              onChange={(event) => {
                setDeleteAccessKeyDraft(event.target.value);
                setDeleteErrorMessage(null);
              }}
              placeholder="삭제 비밀번호"
            />
          ) : null}

          {deleteErrorMessage ? <p className="text-sm text-danger">{deleteErrorMessage}</p> : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTargetId(null);
                setDeleteAccessKeyDraft("");
                setDeleteErrorMessage(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={
                deleteBoardMutation.isPending ||
                !deleteTarget ||
                (deleteTarget.isProtected && deleteAccessKeyDraft.trim().length === 0)
              }
              onClick={() => {
                if (!deleteTarget) {
                  return;
                }

                deleteBoardMutation.mutate({
                  boardId: deleteTarget.id,
                  editorAccessKey: deleteTarget.isProtected ? deleteAccessKeyDraft.trim() : undefined
                });
              }}
            >
              {deleteBoardMutation.isPending ? "삭제 중..." : "화이트보드 삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
