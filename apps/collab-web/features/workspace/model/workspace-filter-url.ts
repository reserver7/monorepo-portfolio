import type { WorkspaceFilterState, WorkspaceItemKind, WorkspaceItemSort } from "./workspace-items";

const workspaceKinds: WorkspaceItemKind[] = ["all", "document", "board"];
const workspaceSorts: WorkspaceItemSort[] = ["recent", "name"];

export const parseWorkspaceFilterSearch = (search: string): WorkspaceFilterState => {
  const params = new URLSearchParams(search);
  const kind = params.get("kind") as WorkspaceItemKind | null;
  const sort = params.get("sort") as WorkspaceItemSort | null;
  const reset: WorkspaceFilterState = {
    query: "",
    kind: "all",
    sharedOnly: false,
    sort: "recent"
  };

  return {
    query: params.get("q") ?? reset.query,
    kind: kind && workspaceKinds.includes(kind) ? kind : reset.kind,
    sharedOnly: params.get("shared") === "1",
    sort: sort && workspaceSorts.includes(sort) ? sort : reset.sort
  };
};

export const createWorkspaceFilterSearch = (state: WorkspaceFilterState): string => {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.kind !== "all") params.set("kind", state.kind);
  if (state.sort !== "recent") params.set("sort", state.sort);
  if (state.sharedOnly) params.set("shared", "1");
  const search = params.toString();
  return search ? `?${search}` : "";
};
