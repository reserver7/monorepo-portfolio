"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { socketEventName } from "@repo/utils/collab";
import { io } from "socket.io-client";
import {
  Badge,
  Button,
  Card,
  Input,
  MarketingGlassNav,
  MarketingSection,
  Select,
  Skeleton,
  Typography,
  promptConfirm,
  Flex,
  Grid
} from "@repo/ui";
import { CollabLocaleFilter } from "@/features/common/components/collab-locale-filter";
import { FeedbackState } from "@/features/common/components/feedback-state";
import { PendingInvitations } from "@/features/common/components/pending-invitations";
import { RecentWorkspaceActivity } from "@/features/common/components/recent-workspace-activity";
import { WorkspaceSharePanel } from "@/features/common/components/workspace-share-panel";
import { WorkspaceTrash } from "@/features/workspace/components/workspace-trash";
import {
  getWorkspaceFavorites,
  setWorkspaceFavorites,
  workspaceFavoritesQueryKey
} from "@/features/workspace/api/favorites-api";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  API_BASE_URL,
  createDocument,
  duplicateDocument,
  listDocuments,
  docsQueryKeys,
  renameDocument
} from "@/features/docs/documents/api";
import {
  createBoard,
  duplicateBoard,
  listBoards,
  renameBoard,
  whiteboardQueryKeys
} from "@/features/whiteboard/boards/api";
import { fetchRealtimeAccountToken } from "@/lib/auth/realtime-token";
import {
  filterWorkspaceItems,
  getWorkspaceItemKey,
  mergeWorkspaceItems,
  type WorkspaceItemKind,
  type WorkspaceItemSort
} from "@/features/workspace/model/workspace-items";

const favoritesStorageKey = "collab.workspace.favorite-keys";
const favoritesMigrationKey = "collab.workspace.favorite-keys.synced";

export default function WorkspaceDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<WorkspaceItemKind>("all");
  const [sharedOnly, setSharedOnly] = useState(false);
  const [sort, setSort] = useState<WorkspaceItemSort>("recent");
  const [documentTitle, setDocumentTitle] = useState("");
  const [boardTitle, setBoardTitle] = useState("");
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [shareKey, setShareKey] = useState<string | null>(null);
  const createDocumentMutation = useMutation({
    mutationFn: (title: string) => createDocument({ title, actor: "대시보드 사용자" })
  });
  const createBoardMutation = useMutation({
    mutationFn: (title: string) => createBoard({ title, actor: "대시보드 사용자" })
  });
  const { mutate: syncFavorites } = useMutation({ mutationFn: setWorkspaceFavorites });
  const renameMutation = useMutation({
    mutationFn: async (input: { item: (typeof workspaceItems)[number]; title: string }): Promise<unknown> => {
      if (input.item.kind === "document") {
        return renameDocument({ documentId: input.item.id, title: input.title });
      }
      return renameBoard({ boardId: input.item.id, title: input.title });
    }
  });
  const duplicateMutation = useMutation({
    mutationFn: async (item: (typeof workspaceItems)[number]): Promise<unknown> => {
      if (item.kind === "document") return duplicateDocument(item.id);
      return duplicateBoard(item.id);
    }
  });
  const documentsQuery = useQuery({
    queryKey: docsQueryKeys.documents(),
    queryFn: listDocuments,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: "always"
  });
  const boardsQuery = useQuery({
    queryKey: whiteboardQueryKeys.boards(),
    queryFn: listBoards,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: "always"
  });
  const favoritesQuery = useQuery({
    queryKey: workspaceFavoritesQueryKey,
    queryFn: getWorkspaceFavorites,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: "always"
  });

  const workspaceItems = mergeWorkspaceItems(documentsQuery.data ?? [], boardsQuery.data ?? []);
  const items = filterWorkspaceItems(workspaceItems, { query, kind, sort, favoriteKeys, sharedOnly });
  const isLoading = documentsQuery.isLoading || boardsQuery.isLoading;
  const isError = documentsQuery.isError || boardsQuery.isError;
  const isCreating = createDocumentMutation.isPending || createBoardMutation.isPending;

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(favoritesStorageKey) ?? "[]") as unknown;
      if (Array.isArray(stored)) {
        setFavoriteKeys(new Set(stored.filter((value): value is string => typeof value === "string")));
      }
    } catch {
      setFavoriteKeys(new Set());
    }
  }, []);

  useEffect(() => {
    if (!favoritesQuery.data) return;
    const serverKeys = favoritesQuery.data.favoriteKeys;
    const localValue = localStorage.getItem(favoritesStorageKey);
    if (serverKeys.length === 0 && localValue && localStorage.getItem(favoritesMigrationKey) !== "true") {
      try {
        const localKeys = JSON.parse(localValue) as unknown;
        if (
          Array.isArray(localKeys) &&
          localKeys.every((key) => typeof key === "string") &&
          localKeys.length > 0
        ) {
          setFavoriteKeys(new Set(localKeys));
          syncFavorites(localKeys, {
            onSuccess: (result) => {
              setFavoriteKeys(new Set(result.favoriteKeys));
              localStorage.setItem(favoritesStorageKey, JSON.stringify(result.favoriteKeys));
              localStorage.setItem(favoritesMigrationKey, "true");
            }
          });
          return;
        }
      } catch {
        // Keep the server state when the legacy browser value is invalid.
      }
    }
    setFavoriteKeys(new Set(serverKeys));
    localStorage.setItem(favoritesStorageKey, JSON.stringify(serverKeys));
    localStorage.setItem(favoritesMigrationKey, "true");
  }, [syncFavorites, favoritesQuery.data]);

  const toggleFavorite = (item: (typeof workspaceItems)[number]) => {
    const key = getWorkspaceItemKey(item);
    const previous = new Set(favoriteKeys);
    const next = new Set(favoriteKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setFavoriteKeys(next);
    localStorage.setItem(favoritesStorageKey, JSON.stringify([...next]));
    syncFavorites([...next], {
      onSuccess: (result) => {
        setFavoriteKeys(new Set(result.favoriteKeys));
        localStorage.setItem(favoritesStorageKey, JSON.stringify(result.favoriteKeys));
        localStorage.setItem(favoritesMigrationKey, "true");
        setFavoriteError(null);
      },
      onError: () => {
        setFavoriteKeys(previous);
        localStorage.setItem(favoritesStorageKey, JSON.stringify([...previous]));
        setFavoriteError("즐겨찾기를 저장하지 못했습니다.");
      }
    });
  };

  const createDocumentFromDashboard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = documentTitle.trim();
    if (!title) {
      setCreationError("문서 제목을 입력하세요.");
      return;
    }
    setCreationError(null);
    try {
      const { document } = await createDocumentMutation.mutateAsync(title);
      router.push(`/docs/${document.id}`);
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : "문서를 만들지 못했습니다.");
    }
  };

  const createBoardFromDashboard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = boardTitle.trim();
    if (!title) {
      setCreationError("화이트보드 제목을 입력하세요.");
      return;
    }
    setCreationError(null);
    try {
      const { board } = await createBoardMutation.mutateAsync(title);
      router.push(`/whiteboard/${board.id}`);
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : "화이트보드를 만들지 못했습니다.");
    }
  };

  const renameItem = async (item: (typeof workspaceItems)[number]) => {
    const title = await promptConfirm({
      title: `${item.kind === "document" ? "문서" : "화이트보드"} 이름 변경`,
      inputLabel: "새 이름",
      inputPlaceholder: "이름을 입력하세요",
      inputDefaultValue: item.title,
      confirmText: "저장",
      cancelText: "취소",
      inputRequired: true,
      trimResult: true,
      validator: (value) => (value.trim() ? null : "이름을 입력하세요.")
    });
    if (title === null) return;

    setRenameError(null);
    try {
      await renameMutation.mutateAsync({ item, title });
      await queryClient.invalidateQueries({ queryKey: docsQueryKeys.documents() });
      await queryClient.invalidateQueries({ queryKey: whiteboardQueryKeys.boards() });
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : "이름을 변경하지 못했습니다.");
    }
  };

  const duplicateItem = async (item: (typeof workspaceItems)[number]) => {
    setDuplicateError(null);
    try {
      await duplicateMutation.mutateAsync(item);
      await queryClient.invalidateQueries({ queryKey: docsQueryKeys.documents() });
      await queryClient.invalidateQueries({ queryKey: whiteboardQueryKeys.boards() });
    } catch (error) {
      setDuplicateError(error instanceof Error ? error.message : "작업 공간을 복제하지 못했습니다.");
    }
  };

  useEffect(() => {
    const refresh = () => {
      void documentsQuery.refetch();
      void boardsQuery.refetch();
    };
    const socket = io(API_BASE_URL, { transports: ["websocket"], reconnection: true });
    const subscribe = async () => {
      const accountToken = await fetchRealtimeAccountToken();
      if (accountToken) {
        socket.emit(socketEventName.notificationsSubscribe, { accountToken });
      }
      refresh();
    };

    socket.on(socketEventName.workspaceUpdate, refresh);
    socket.on("connect", () => void subscribe());
    if (socket.connected) void subscribe();

    return () => {
      socket.off(socketEventName.workspaceUpdate, refresh);
      socket.disconnect();
    };
  }, [boardsQuery.refetch, documentsQuery.refetch]);

  return (
    <>
      <MarketingGlassNav
        product="Collab Workspace"
        subtitle="Your shared workspaces"
        rightSlot={
          <Flex className="flex items-center gap-2">
            <CollabLocaleFilter />
            <SignOutButton />
          </Flex>
        }
        actions={[
          { label: "문서", onClick: () => router.push("/docs") },
          { label: "화이트보드", onClick: () => router.push("/whiteboard") }
        ]}
      />
      <main className="mx-auto min-h-screen w-full max-w-[1360px] px-4 pb-10 pt-3 md:px-8 md:pb-12 md:pt-4">
        <PendingInvitations />
        <RecentWorkspaceActivity />
        <WorkspaceTrash />
        <MarketingSection tone="light" className="bg-surface-elevated/45">
          <div className="mb-5">
            <Typography as="h1" variant="h2">
              내 작업 공간
            </Typography>
            <Typography as="p" variant="bodySm" color="muted" className="mt-2">
              문서와 화이트보드를 한곳에서 이어서 작업하세요.
            </Typography>
          </div>

          <Grid className="mb-5 grid gap-3 md:grid-cols-2">
            <form
              className="border-default bg-surface grid gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
              onSubmit={(event) => void createDocumentFromDashboard(event)}
            >
              <Input
                label="새 문서"
                labelClassName="text-body-sm text-muted"
                className="mt-1"
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                placeholder="문서 제목"
                disabled={isCreating}
              />
              <Button
                type="submit"
                size="sm"
                loading={createDocumentMutation.isPending}
                disabled={isCreating}
              >
                문서 만들기
              </Button>
            </form>
            <form
              className="border-default bg-surface grid gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
              onSubmit={(event) => void createBoardFromDashboard(event)}
            >
              <Input
                label="새 화이트보드"
                labelClassName="text-body-sm text-muted"
                className="mt-1"
                value={boardTitle}
                onChange={(event) => setBoardTitle(event.target.value)}
                placeholder="화이트보드 제목"
                disabled={isCreating}
              />
              <Button type="submit" size="sm" loading={createBoardMutation.isPending} disabled={isCreating}>
                화이트보드 만들기
              </Button>
            </form>
          </Grid>
          {creationError ? (
            <Typography as="p" variant="bodySm" color="danger" className="mb-5">
              {creationError}
            </Typography>
          ) : null}
          {renameError ? (
            <Typography as="p" variant="bodySm" color="danger" className="mb-5">
              {renameError}
            </Typography>
          ) : null}
          {favoriteError ? (
            <Typography as="p" variant="bodySm" color="danger" className="mb-5">
              {favoriteError}
            </Typography>
          ) : null}
          {duplicateError ? (
            <Typography as="p" variant="bodySm" color="danger" className="mb-5">
              {duplicateError}
            </Typography>
          ) : null}

          <Grid className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_200px]">
            <Input
              label="작업 공간 검색"
              labelClassName="text-body-sm text-muted"
              className="mt-1"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="이름으로 검색"
            />
            <Select
              label="유형"
              labelClassName="text-body-sm text-muted"
              className="mt-1"
              value={kind}
              options={[
                { value: "all", label: "전체" },
                { value: "document", label: "문서" },
                { value: "board", label: "화이트보드" }
              ]}
              onChange={(value) => setKind(value as WorkspaceItemKind)}
            />
            <Select
              label="정렬"
              labelClassName="text-body-sm text-muted"
              className="mt-1"
              value={sort}
              options={[
                { value: "recent", label: "최근 수정순" },
                { value: "name", label: "이름순" }
              ]}
              onChange={(value) => setSort(value as WorkspaceItemSort)}
            />
            <Select
              label="공유 상태"
              labelClassName="text-body-sm text-muted"
              className="mt-1"
              value={sharedOnly ? "shared" : "all"}
              options={[
                { value: "all", label: "전체" },
                { value: "shared", label: "공유됨" }
              ]}
              onChange={(value) => setSharedOnly(value === "shared")}
            />
          </Grid>

          {isLoading ? (
            <Grid className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={`workspace-loading-${index}`} className="space-y-3 p-5" radius="lg">
                  <Skeleton className="h-5 w-2/5" />
                  <Skeleton className="h-6 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </Card>
              ))}
            </Grid>
          ) : isError ? (
            <FeedbackState
              variant="error"
              size="lg"
              title="작업 공간을 불러오지 못했습니다."
              description="잠시 후 다시 시도하세요."
            />
          ) : items.length === 0 ? (
            <FeedbackState
              variant="empty"
              size="lg"
              title={
                workspaceItems.length === 0
                  ? "아직 작업 공간이 없습니다."
                  : "조건에 맞는 작업 공간이 없습니다."
              }
              description={
                workspaceItems.length === 0
                  ? "문서 또는 화이트보드 홈에서 첫 작업 공간을 만들어 보세요."
                  : "검색어 또는 필터를 바꿔 다시 시도하세요."
              }
            />
          ) : (
            <Grid className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const isFavorite = favoriteKeys.has(getWorkspaceItemKey(item));
                const pendingInvite = item.members.some((member) => member.status === "pending");
                const permissionLabel =
                  item.permission === "owner"
                    ? "소유자"
                    : item.permission === "editor"
                      ? "편집자"
                      : item.permission === "viewer"
                        ? "열람자"
                        : "기존 권한";
                return (
                  <div key={`${item.kind}:${item.id}`} className="relative">
                    <Link href={item.path} className="group block">
                      <Card
                        className="border-default/80 bg-surface h-full border p-5 pb-14 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgb(15_23_42/0.13)]"
                        radius="lg"
                      >
                        <Flex className="flex items-start justify-between gap-3 pr-8">
                          <Badge variant={item.kind === "document" ? "info" : "success"}>
                            {item.kind === "document" ? "문서" : "화이트보드"}
                          </Badge>
                          <span className="text-muted text-xs">열기 →</span>
                        </Flex>
                        <Typography as="h2" variant="title" className="mt-5 line-clamp-2 break-words">
                          {item.title.trim() || "제목 없음"}
                        </Typography>
                        <Typography as="p" variant="bodySm" color="muted" className="mt-3">
                          최근 수정: {new Date(item.updatedAt).toLocaleString("ko-KR")}
                        </Typography>
                        <Flex className="mt-3 flex flex-wrap items-center gap-2">
                          <Typography as="span" variant="caption" color="muted">
                            {item.members.length > 0
                              ? `${item.members.length}명 공유 · ${permissionLabel}`
                              : "개인 작업 공간"}
                          </Typography>
                          {pendingInvite ? <Badge variant="warning">초대 대기</Badge> : null}
                        </Flex>
                      </Card>
                    </Link>
                    <Button
                      variant="text"
                      size="sm"
                      className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 px-0 text-xs"
                      disabled={duplicateMutation.isPending}
                      onClick={() => void duplicateItem(item)}
                    >
                      복제
                    </Button>
                    <Button
                      variant="text"
                      size="sm"
                      className="absolute bottom-4 left-5 z-10 px-0 text-xs"
                      disabled={renameMutation.isPending}
                      onClick={() => void renameItem(item)}
                    >
                      이름 변경
                    </Button>
                    <Button
                      variant="text"
                      size="sm"
                      className="absolute bottom-4 right-5 z-10 px-0 text-xs"
                      aria-pressed={shareKey === getWorkspaceItemKey(item)}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const key = getWorkspaceItemKey(item);
                        setShareKey((current) => (current === key ? null : key));
                      }}
                    >
                      {shareKey === getWorkspaceItemKey(item) ? "공유 닫기" : "공유"}
                    </Button>
                    <Button
                      variant="text"
                      size="sm"
                      className="text-warning absolute right-4 top-4 z-10 text-xl leading-none"
                      aria-label={isFavorite ? "고정 해제" : "작업 공간 고정"}
                      aria-pressed={isFavorite}
                      onClick={() => toggleFavorite(item)}
                    >
                      {isFavorite ? "★" : "☆"}
                    </Button>
                  </div>
                );
              })}
            </Grid>
          )}
          {shareKey
            ? (() => {
                const sharedItem = workspaceItems.find((item) => getWorkspaceItemKey(item) === shareKey);
                if (!sharedItem) return null;
                return (
                  <WorkspaceSharePanel
                    kind={sharedItem.kind === "document" ? "documents" : "boards"}
                    entityId={sharedItem.id}
                    onClose={() => setShareKey(null)}
                  />
                );
              })()
            : null}
        </MarketingSection>
      </main>
    </>
  );
}
