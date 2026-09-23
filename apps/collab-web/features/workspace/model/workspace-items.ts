import type { DocumentSummary, WhiteboardSummary, WorkspaceMember } from "@repo/utils/collab";

export type WorkspaceItem = {
  id: string;
  kind: "document" | "board";
  title: string;
  updatedAt: string;
  path: string;
  members: WorkspaceMember[];
  permission?: "owner" | "viewer" | "editor" | "legacy";
};

export type WorkspaceItemKind = "all" | WorkspaceItem["kind"];
export type WorkspaceItemSort = "recent" | "name";

export const getWorkspaceItemKey = (item: WorkspaceItem): string => `${item.kind}:${item.id}`;

export const mergeWorkspaceItems = (
  documents: DocumentSummary[],
  boards: WhiteboardSummary[]
): WorkspaceItem[] => {
  const items = new Map<string, WorkspaceItem>();

  for (const document of documents) {
    if (!items.has(`document:${document.id}`)) {
      items.set(`document:${document.id}`, {
        id: document.id,
        kind: "document",
        title: document.title,
        updatedAt: document.updatedAt,
        path: `/docs/${document.id}`,
        members: document.members ?? [],
        permission: document.permission
      });
    }
  }
  for (const board of boards) {
    if (!items.has(`board:${board.id}`)) {
      items.set(`board:${board.id}`, {
        id: board.id,
        kind: "board",
        title: board.title,
        updatedAt: board.updatedAt,
        path: `/whiteboard/${board.id}`,
        members: board.members ?? [],
        permission: board.permission
      });
    }
  }

  return [...items.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
};

export const filterWorkspaceItems = (
  items: WorkspaceItem[],
  options: {
    query?: string;
    kind?: WorkspaceItemKind;
    sharedOnly?: boolean;
    sort?: WorkspaceItemSort;
    favoriteKeys?: ReadonlySet<string>;
  } = {}
): WorkspaceItem[] => {
  const query = options.query?.trim().toLocaleLowerCase("ko-KR") ?? "";
  const kind = options.kind ?? "all";
  const sort = options.sort ?? "recent";
  const favoriteKeys = options.favoriteKeys ?? new Set<string>();

  return items
    .filter((item) => {
      const matchesKind = kind === "all" || item.kind === kind;
      const matchesShared = !options.sharedOnly || item.members.length > 0;
      const matchesQuery = item.title.toLocaleLowerCase("ko-KR").includes(query);
      return matchesKind && matchesShared && matchesQuery;
    })
    .sort((left, right) => {
      const favoriteOrder =
        Number(favoriteKeys.has(getWorkspaceItemKey(right))) -
        Number(favoriteKeys.has(getWorkspaceItemKey(left)));
      if (favoriteOrder !== 0) return favoriteOrder;
      if (sort === "name") {
        return left.title.localeCompare(right.title, "ko-KR", { sensitivity: "base" });
      }
      return right.updatedAt.localeCompare(left.updatedAt);
    });
};
