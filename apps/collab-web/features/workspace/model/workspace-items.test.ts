import assert from "node:assert/strict";
import type { DocumentSummary, WhiteboardSummary } from "@repo/utils/collab";

// @ts-expect-error Node's strip-types runner requires the explicit extension.
import * as workspaceItems from "./workspace-items.ts";
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { isWorkspaceSearchShortcut } from "./workspace-shortcuts.ts";
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { createWorkspaceFilterSearch, parseWorkspaceFilterSearch } from "./workspace-filter-url.ts";

const {
  filterWorkspaceItems,
  getWorkspaceCommandResults,
  getWorkspaceItemCapabilities,
  getWorkspaceItemKey,
  getWorkspaceNavigationIndex,
  getWorkspaceFilterReset,
  mergeWorkspaceItems
} = workspaceItems;

const document: DocumentSummary = {
  id: "doc-1",
  members: [],
  title: "Roadmap",
  isProtected: false,
  snippet: "",
  commentCount: 0,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T10:00:00.000Z",
  version: 1
};
const board: WhiteboardSummary = {
  id: "board-1",
  members: [{ email: "member@example.com", role: "viewer", invitedAt: "2026-09-20T00:00:00.000Z" }],
  permission: "owner",
  title: "Planning",
  isProtected: false,
  shapeCount: 2,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T10:00:00.000Z",
  version: 1
};

assert.deepEqual(mergeWorkspaceItems([document, { ...document, title: "Duplicate" }], [board]), [
  {
    id: "board-1",
    kind: "board",
    title: "Planning",
    updatedAt: "2026-09-21T10:00:00.000Z",
    path: "/whiteboard/board-1",
    members: [{ email: "member@example.com", role: "viewer", invitedAt: "2026-09-20T00:00:00.000Z" }],
    permission: "owner"
  },
  {
    id: "doc-1",
    kind: "document",
    title: "Roadmap",
    updatedAt: "2026-09-20T10:00:00.000Z",
    path: "/docs/doc-1",
    members: [],
    permission: undefined
  }
]);
console.log("workspace items: ok");

const items = mergeWorkspaceItems([document], [board]);
const primaryItem = items[0]!;
assert.deepEqual(
  filterWorkspaceItems(items, { query: "plan", kind: "board", sort: "name" }).map((item) => item.id),
  ["board-1"]
);
assert.deepEqual(
  filterWorkspaceItems(items, { sharedOnly: true }).map((item) => item.id),
  ["board-1"]
);
assert.deepEqual(
  filterWorkspaceItems(items, { query: "", kind: "all", sort: "name" }).map((item) => item.title),
  ["Planning", "Roadmap"]
);
console.log("workspace item filters: ok");

assert.equal(getWorkspaceItemKey(items[0]!), "board:board-1");
assert.deepEqual(
  filterWorkspaceItems(items, {
    query: "",
    kind: "all",
    sort: "name",
    favoriteKeys: new Set(["document:doc-1"])
  }).map((item) => item.id),
  ["doc-1", "board-1"]
);
console.log("workspace item favorites: ok");

assert.deepEqual(getWorkspaceFilterReset(), {
  query: "",
  kind: "all",
  sharedOnly: false,
  sort: "recent"
});
console.log("workspace filter reset: ok");

assert.equal(isWorkspaceSearchShortcut("/", false, false), true);
assert.equal(isWorkspaceSearchShortcut("k", true, true), true);
assert.equal(isWorkspaceSearchShortcut("/", true, false), false);
assert.equal(isWorkspaceSearchShortcut("k", false, false), false);
console.log("workspace search shortcut: ok");

assert.deepEqual(
  getWorkspaceCommandResults(items, "road").map((item) => `${item.kind}:${item.id}`),
  ["document:doc-1"]
);
console.log("workspace command results: ok");

assert.deepEqual(getWorkspaceItemCapabilities({ ...primaryItem, permission: "viewer" }), {
  canEdit: false,
  canManage: false,
  canDelete: false,
  canViewSharing: true
});
assert.deepEqual(getWorkspaceItemCapabilities({ ...primaryItem, permission: "editor" }), {
  canEdit: true,
  canManage: false,
  canDelete: false,
  canViewSharing: true
});
assert.deepEqual(getWorkspaceItemCapabilities({ ...primaryItem, permission: "owner" }), {
  canEdit: true,
  canManage: true,
  canDelete: true,
  canViewSharing: false
});
console.log("workspace item capabilities: ok");

assert.deepEqual(parseWorkspaceFilterSearch("?q=road%20map&kind=document&sort=name&shared=1"), {
  query: "road map",
  kind: "document",
  sort: "name",
  sharedOnly: true
});
assert.equal(
  createWorkspaceFilterSearch({ query: " road ", kind: "document", sort: "name", sharedOnly: true }),
  "?q=road&kind=document&sort=name&shared=1"
);
assert.deepEqual(parseWorkspaceFilterSearch("?kind=invalid&sort=invalid"), {
  query: "",
  kind: "all",
  sort: "recent",
  sharedOnly: false
});
console.log("workspace filter URL: ok");

assert.equal(getWorkspaceNavigationIndex(0, "next", 3), 1);
assert.equal(getWorkspaceNavigationIndex(0, "previous", 3), 2);
assert.equal(getWorkspaceNavigationIndex(2, "next", 3), 0);
assert.equal(getWorkspaceNavigationIndex(0, "next", 0), -1);
console.log("workspace keyboard navigation: ok");
