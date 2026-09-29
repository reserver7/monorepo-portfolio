"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { socketEventName } from "@repo/utils/collab";
import { io } from "socket.io-client";
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  MarketingGlassNav,
  MarketingSection,
  Select,
  Skeleton,
  Typography,
  confirm,
  promptConfirm,
  toast,
  Flex,
  Grid
} from "@repo/ui";
import { CollabLocaleFilter } from "@/features/common/components/collab-locale-filter";
import { FeedbackState } from "@/features/common/components/feedback-state";
import { PendingInvitations } from "@/features/common/components/pending-invitations";
import { RecentWorkspaceActivity } from "@/features/common/components/recent-workspace-activity";
import { WorkspaceSharePanel } from "@/features/common/components/workspace-share-panel";
import { WorkspaceTrash } from "@/features/workspace/components/workspace-trash";
import { WorkspaceCommandPalette } from "@/features/workspace/components/workspace-command-palette";
import {
  getWorkspaceFavorites,
  setWorkspaceFavorites,
  workspaceFavoritesQueryKey
} from "@/features/workspace/api/favorites-api";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  API_BASE_URL,
  createDocument,
  deleteDocumentById,
  duplicateDocument,
  listDocuments,
  docsQueryKeys,
  renameDocument
} from "@/features/docs/documents/api";
import {
  createBoard,
  deleteBoardById,
  duplicateBoard,
  listBoards,
  renameBoard,
  whiteboardQueryKeys
} from "@/features/whiteboard/boards/api";
import { fetchRealtimeAccountToken } from "@/lib/auth/realtime-token";
import {
  filterWorkspaceItems,
  getWorkspaceFilterReset,
  getWorkspaceItemCapabilities,
  getWorkspaceItemKey,
  getWorkspaceNavigationIndex,
  mergeWorkspaceItems,
  type WorkspaceFilterState,
  type WorkspaceItem,
  type WorkspaceItemKind,
  type WorkspaceItemSort
} from "@/features/workspace/model/workspace-items";
import { isWorkspaceSearchShortcut } from "@/features/workspace/model/workspace-shortcuts";
import {
  createWorkspaceFilterSearch,
  parseWorkspaceFilterSearch
} from "@/features/workspace/model/workspace-filter-url";
import { restoreTrashItem, workspaceTrashQueryKey } from "@/features/workspace/api/trash-api";

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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<WorkspaceItem | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [urlHydrated, setUrlHydrated] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workspaceLinkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const previousUrlFiltersRef = useRef<WorkspaceFilterState | null>(null);
  const [shareKey, setShareKey] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const createDocumentMutation = useMutation({
    mutationFn: (title: string) => createDocument({ title, actor: "대시보드 사용자" })
  });
  const createBoardMutation = useMutation({
    mutationFn: (title: string) => createBoard({ title, actor: "대시보드 사용자" })
  });
  const { mutate: syncFavorites } = useMutation({ mutationFn: setWorkspaceFavorites });
  const restoreMutation = useMutation({ mutationFn: restoreTrashItem });
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
  const deleteMutation = useMutation({
    mutationFn: async (item: (typeof workspaceItems)[number]): Promise<unknown> => {
      if (item.kind === "document") return deleteDocumentById({ documentId: item.id, notifyOnError: false });
      return deleteBoardById({ boardId: item.id, notifyOnError: false });
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
  const hasLoadedData = documentsQuery.data !== undefined && boardsQuery.data !== undefined;
  const isBlockingError = isError && !hasLoadedData;
  const isCreating = createDocumentMutation.isPending || createBoardMutation.isPending;

  const refreshWorkspaceItems = useCallback(async () => {
    setIsRefreshing(true);
    setSyncError(null);
    try {
      const [documentsResult, boardsResult] = await Promise.all([
        documentsQuery.refetch(),
        boardsQuery.refetch()
      ]);
      if (documentsResult.error || boardsResult.error) {
        throw documentsResult.error ?? boardsResult.error;
      }
      setLastSyncedAt(new Date());
    } catch {
      setSyncError("최신 작업 공간 목록을 불러오지 못했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }, [boardsQuery.refetch, documentsQuery.refetch]);

  useEffect(() => {
    if (hasLoadedData && !lastSyncedAt) setLastSyncedAt(new Date());
  }, [hasLoadedData, lastSyncedAt]);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      if (!isWorkspaceSearchShortcut(event.key, event.metaKey, event.ctrlKey)) return;
      event.preventDefault();
      setCommandPaletteOpen(true);
    };

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  useEffect(() => {
    const applyUrlFilters = () => {
      const filters = parseWorkspaceFilterSearch(window.location.search);
      setQuery(filters.query);
      setKind(filters.kind);
      setSharedOnly(filters.sharedOnly);
      setSort(filters.sort);
    };

    applyUrlFilters();
    setUrlHydrated(true);
    window.addEventListener("popstate", applyUrlFilters);
    return () => window.removeEventListener("popstate", applyUrlFilters);
  }, []);

  useEffect(() => {
    if (!urlHydrated) return;
    const nextFilters = { query, kind, sharedOnly, sort };
    const previousFilters = previousUrlFiltersRef.current;
    previousUrlFiltersRef.current = nextFilters;
    const search = createWorkspaceFilterSearch(nextFilters);
    const nextUrl = `${window.location.pathname}${search}${window.location.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` === nextUrl) return;
    const onlyQueryChanged =
      previousFilters &&
      previousFilters.kind === kind &&
      previousFilters.sharedOnly === sharedOnly &&
      previousFilters.sort === sort;
    window.history[onlyQueryChanged ? "replaceState" : "pushState"](null, "", nextUrl);
  }, [kind, query, sharedOnly, sort, urlHydrated]);

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
    setPendingAction(getWorkspaceItemKey(item));
    try {
      await renameMutation.mutateAsync({ item, title });
      await queryClient.invalidateQueries({ queryKey: docsQueryKeys.documents() });
      await queryClient.invalidateQueries({ queryKey: whiteboardQueryKeys.boards() });
      toast.success("이름을 변경했습니다.");
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : "이름을 변경하지 못했습니다.");
    } finally {
      setPendingAction(null);
    }
  };

  const duplicateItem = async (item: (typeof workspaceItems)[number]) => {
    setDuplicateError(null);
    setPendingAction(getWorkspaceItemKey(item));
    try {
      await duplicateMutation.mutateAsync(item);
      await queryClient.invalidateQueries({ queryKey: docsQueryKeys.documents() });
      await queryClient.invalidateQueries({ queryKey: whiteboardQueryKeys.boards() });
      toast.success("작업 공간을 복제했습니다.");
    } catch (error) {
      setDuplicateError(error instanceof Error ? error.message : "작업 공간을 복제하지 못했습니다.");
    } finally {
      setPendingAction(null);
    }
  };

  const deleteItem = async (item: (typeof workspaceItems)[number]) => {
    const confirmed = await confirm({
      title: `${item.kind === "document" ? "문서" : "화이트보드"}를 휴지통으로 이동할까요?`,
      description: "휴지통에서 복구할 수 있습니다.",
      confirmText: "휴지통으로 이동",
      confirmVariant: "danger",
      cancelText: "취소"
    });
    if (!confirmed) return;

    setDeleteError(null);
    setPendingAction(getWorkspaceItemKey(item));
    try {
      await deleteMutation.mutateAsync(item);
      await queryClient.invalidateQueries({ queryKey: docsQueryKeys.documents() });
      await queryClient.invalidateQueries({ queryKey: whiteboardQueryKeys.boards() });
      await queryClient.invalidateQueries({ queryKey: workspaceTrashQueryKey });
      if (shareKey === getWorkspaceItemKey(item)) setShareKey(null);
      setUndoItem(item);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => setUndoItem(null), 8000);
      toast.success("휴지통으로 이동했습니다.");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "작업 공간을 삭제하지 못했습니다.");
    } finally {
      setPendingAction(null);
    }
  };

  const undoDelete = async () => {
    if (!undoItem) return;
    const item = undoItem;
    setPendingAction(getWorkspaceItemKey(item));
    try {
      await restoreMutation.mutateAsync({ kind: item.kind, id: item.id });
      await queryClient.invalidateQueries({ queryKey: docsQueryKeys.documents() });
      await queryClient.invalidateQueries({ queryKey: whiteboardQueryKeys.boards() });
      await queryClient.invalidateQueries({ queryKey: workspaceTrashQueryKey });
      setUndoItem(null);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      toast.success("작업 공간을 복구했습니다.");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "작업 공간을 복구하지 못했습니다.");
    } finally {
      setPendingAction(null);
    }
  };

  useEffect(
    () => () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    },
    []
  );

  useEffect(() => {
    const socket = io(API_BASE_URL, { transports: ["websocket"], reconnection: true });
    const subscribe = async () => {
      const accountToken = await fetchRealtimeAccountToken();
      if (accountToken) {
        socket.emit(socketEventName.notificationsSubscribe, { accountToken });
      }
      void refreshWorkspaceItems();
    };

    socket.on(socketEventName.workspaceUpdate, refreshWorkspaceItems);
    socket.on("connect", () => void subscribe());
    if (socket.connected) void subscribe();

    return () => {
      socket.off(socketEventName.workspaceUpdate, refreshWorkspaceItems);
      socket.disconnect();
    };
  }, [refreshWorkspaceItems]);

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
          { label: "빠른 검색", onClick: () => setCommandPaletteOpen(true) },
          { label: "문서", onClick: () => router.push("/docs") },
          { label: "화이트보드", onClick: () => router.push("/whiteboard") }
        ]}
      />
      <main className="mx-auto min-h-screen w-full max-w-[1360px] px-4 pb-10 pt-3 md:px-8 md:pb-12 md:pt-4">
        <PendingInvitations />
        <RecentWorkspaceActivity />
        <WorkspaceTrash />
        {undoItem ? (
          <Flex className="border-default bg-surface mb-6 items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <Typography as="p" variant="bodySm">
              “{undoItem.title || "제목 없음"}”을(를) 휴지통으로 이동했습니다.
            </Typography>
            <Button
              size="sm"
              variant="outline"
              loading={pendingAction === getWorkspaceItemKey(undoItem)}
              onClick={() => void undoDelete()}
            >
              실행 취소
            </Button>
          </Flex>
        ) : null}
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
                id="workspace-create-document"
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
                id="workspace-create-whiteboard"
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
          {deleteError ? (
            <Typography as="p" variant="bodySm" color="danger" className="mb-5">
              {deleteError}
            </Typography>
          ) : null}

          <Grid className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_200px]">
            <Input
              ref={searchInputRef}
              id="workspace-search"
              label="작업 공간 검색"
              labelClassName="text-body-sm text-muted"
              className="mt-1"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="이름으로 검색"
              clearable
              onClear={() => setQuery("")}
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

          <Flex className="mb-5 flex-wrap items-center justify-between gap-2">
            <Typography as="p" variant="caption" color="muted">
              {isRefreshing
                ? "최신 목록을 동기화하는 중…"
                : lastSyncedAt
                  ? `마지막 동기화: ${lastSyncedAt.toLocaleTimeString("ko-KR")}`
                  : "목록 동기화 대기 중"}
            </Typography>
            <Button
              size="sm"
              variant="text"
              loading={isRefreshing}
              onClick={() => void refreshWorkspaceItems()}
            >
              새로고침
            </Button>
          </Flex>
          {syncError && !isBlockingError ? (
            <FeedbackState
              variant="warning"
              size="sm"
              align="left"
              className="mb-5"
              title="목록이 최신 상태가 아닐 수 있습니다."
              description={syncError}
              action={
                <Button size="sm" variant="outline" onClick={() => void refreshWorkspaceItems()}>
                  다시 시도
                </Button>
              }
            />
          ) : null}

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
          ) : isBlockingError ? (
            <FeedbackState
              variant="error"
              size="lg"
              title="작업 공간을 불러오지 못했습니다."
              description="잠시 후 다시 시도하세요."
              action={
                <Button size="sm" variant="outline" onClick={() => void refreshWorkspaceItems()}>
                  다시 시도
                </Button>
              }
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
              action={
                workspaceItems.length === 0 ? (
                  <Flex className="flex flex-wrap justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => document.getElementById("workspace-create-document")?.focus()}
                    >
                      문서 만들기
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById("workspace-create-whiteboard")?.focus()}
                    >
                      화이트보드 만들기
                    </Button>
                  </Flex>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const reset = getWorkspaceFilterReset();
                      setQuery(reset.query);
                      setKind(reset.kind);
                      setSharedOnly(reset.sharedOnly);
                      setSort(reset.sort);
                    }}
                  >
                    필터 초기화
                  </Button>
                )
              }
            />
          ) : (
            <Grid className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const isFavorite = favoriteKeys.has(getWorkspaceItemKey(item));
                const capabilities = getWorkspaceItemCapabilities(item);
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
                    <Link
                      ref={(node) => {
                        const key = getWorkspaceItemKey(item);
                        if (node) workspaceLinkRefs.current.set(key, node);
                        else workspaceLinkRefs.current.delete(key);
                      }}
                      href={item.path}
                      aria-label={`${item.kind === "document" ? "문서" : "화이트보드"}: ${item.title || "제목 없음"}`}
                      className="focus-visible:ring-primary group block rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                          event.preventDefault();
                          const currentIndex = items.findIndex(
                            (candidate) => getWorkspaceItemKey(candidate) === getWorkspaceItemKey(item)
                          );
                          const targetIndex = getWorkspaceNavigationIndex(
                            currentIndex,
                            event.key === "ArrowDown" ? "next" : "previous",
                            items.length
                          );
                          const target = items[targetIndex];
                          if (target) workspaceLinkRefs.current.get(getWorkspaceItemKey(target))?.focus();
                        }
                        if (
                          event.key.toLowerCase() === "f" &&
                          !event.metaKey &&
                          !event.ctrlKey &&
                          !event.altKey
                        ) {
                          event.preventDefault();
                          toggleFavorite(item);
                        }
                      }}
                    >
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
                    {capabilities.canEdit ||
                    capabilities.canManage ||
                    capabilities.canDelete ||
                    capabilities.canViewSharing ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            shape="square"
                            iconOnly
                            className="absolute right-4 top-4 z-10"
                            aria-label={`${item.title || "작업 공간"} 작업 메뉴`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                          >
                            ⋯
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={6}>
                          {capabilities.canEdit ? (
                            <>
                              <DropdownMenuItem
                                disabled={pendingAction === getWorkspaceItemKey(item)}
                                onSelect={() => void renameItem(item)}
                              >
                                이름 변경
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={pendingAction === getWorkspaceItemKey(item)}
                                onSelect={() => void duplicateItem(item)}
                              >
                                복제
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          {capabilities.canManage || capabilities.canViewSharing ? (
                            <DropdownMenuItem
                              onSelect={() => {
                                const key = getWorkspaceItemKey(item);
                                setShareKey((current) => (current === key ? null : key));
                              }}
                            >
                              {shareKey === getWorkspaceItemKey(item)
                                ? "공유 닫기"
                                : capabilities.canManage
                                  ? "공유 관리"
                                  : "공유 정보"}
                            </DropdownMenuItem>
                          ) : null}
                          {capabilities.canDelete ? (
                            <DropdownMenuItem
                              color="danger"
                              disabled={pendingAction === getWorkspaceItemKey(item)}
                              onSelect={() => void deleteItem(item)}
                            >
                              삭제
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                    <Button
                      variant="text"
                      size="sm"
                      className="text-warning absolute right-14 top-4 z-10 text-xl leading-none"
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
                    workspaceTitle={sharedItem.title}
                    canManage={getWorkspaceItemCapabilities(sharedItem).canManage}
                    onLeave={() => {
                      setShareKey(null);
                      void queryClient.invalidateQueries({ queryKey: docsQueryKeys.documents() });
                      void queryClient.invalidateQueries({ queryKey: whiteboardQueryKeys.boards() });
                    }}
                    onClose={() => setShareKey(null)}
                  />
                );
              })()
            : null}
        </MarketingSection>
      </main>
      <WorkspaceCommandPalette
        items={workspaceItems}
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSelect={(item) => router.push(item.path)}
      />
    </>
  );
}
