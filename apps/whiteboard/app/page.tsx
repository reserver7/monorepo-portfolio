"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@repo/ui";
import { createBoard, listBoards } from "@/lib/api";
import { whiteboardClientEnv } from "@/lib/env";
import {
  createGuestName,
  getStoredDisplayName,
  getStoredRole,
  setStoredDisplayName,
  setStoredRole
} from "@/lib/session";
import { navigateToDocsApp } from "@/lib/cross-app";
import { formatExactTime, formatRelativeTime } from "@/lib/time";

export default function WhiteboardHomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [boardTitle, setBoardTitle] = useState("팀 아이디어 보드");
  const [role, setRole] = useState<"viewer" | "editor">(whiteboardClientEnv.defaultRole);

  useEffect(() => {
    const stored = getStoredDisplayName();
    const storedRole = getStoredRole();
    const fallback = createGuestName();
    const nextName = stored?.trim() ? stored : fallback;
    setDisplayName(nextName);
    setStoredDisplayName(nextName);
    setRole(storedRole ?? whiteboardClientEnv.defaultRole);
  }, []);

  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: listBoards,
    staleTime: 5000,
    refetchInterval: 5000
  });

  const createBoardMutation = useMutation({
    mutationFn: (input: { title: string; actor: string }) => createBoard(input),
    onSuccess: async ({ board }) => {
      await queryClient.invalidateQueries({ queryKey: ["boards"] });
      router.push(`/board/${board.id}`);
    }
  });

  const boards = boardsQuery.data ?? [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 md:px-8">
      <section className="mb-8 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-emerald-50/45 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-10 dark:border-slate-800 dark:from-slate-900/95 dark:to-slate-900/75 dark:shadow-[0_20px_45px_rgba(2,6,23,0.42)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-400/55 dark:bg-emerald-500/20 dark:text-emerald-200"
          >
            Realtime Whiteboard
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigateToDocsApp("/");
            }}
          >
            문서로 이동
          </Button>
        </div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 md:text-5xl">실시간 화이트보드 협업</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
          도형 추가, 텍스트 입력, 드래그 이동, 참여자 커서 공유, undo/redo를 실시간 동기화로 제공합니다.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_220px_auto]">
          <Input
            value={displayName}
            onChange={(event) => {
              const next = event.target.value;
              setDisplayName(next);
              setStoredDisplayName(next.trim() || createGuestName());
            }}
            placeholder="표시 이름"
          />
          <Input
            value={boardTitle}
            onChange={(event) => setBoardTitle(event.target.value)}
            placeholder="보드 제목"
          />
          <Select
            value={role}
            onValueChange={(value) => {
              const nextRole = value === "viewer" ? "viewer" : "editor";
              setRole(nextRole);
              setStoredRole(nextRole);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="권한 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">editor (편집 가능)</SelectItem>
              <SelectItem value="viewer">viewer (보기 전용)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() =>
              createBoardMutation.mutate({
                title: boardTitle.trim() || "Untitled board",
                actor: displayName.trim() || createGuestName()
              })
            }
            disabled={createBoardMutation.isPending}
          >
            {createBoardMutation.isPending ? "생성 중..." : "새 보드 만들기"}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="font-heading mb-4 text-2xl font-semibold text-slate-900">보드 목록</h2>
        {boardsQuery.isLoading ? <Card className="p-4 text-sm">불러오는 중...</Card> : null}
        {boardsQuery.isError ? <Card className="p-4 text-sm text-rose-600">보드 목록 조회 실패</Card> : null}

        <div className="grid gap-4 md:grid-cols-2">
          {boards.map((board) => (
            <Card key={board.id}>
              <CardHeader>
                <CardTitle>{board.title}</CardTitle>
                <CardDescription>
                  도형 {board.shapeCount}개 · 버전 {board.version}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-xs text-slate-500">
                  최근 수정: {formatRelativeTime(board.updatedAt)} ({formatExactTime(board.updatedAt)})
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStoredDisplayName(displayName.trim() || createGuestName());
                    setStoredRole(role);
                    router.push(`/board/${board.id}`);
                  }}
                >
                  보드 입장
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
