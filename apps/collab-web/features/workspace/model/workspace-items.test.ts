import assert from "node:assert/strict";
import type { DocumentSummary, WhiteboardSummary } from "@repo/utils/collab";

// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { filterWorkspaceItems, getWorkspaceItemKey, mergeWorkspaceItems } from "./workspace-items.ts";

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
