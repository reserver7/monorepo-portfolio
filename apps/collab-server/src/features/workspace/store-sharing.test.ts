import { describe, expect, test } from "@jest/globals";
import { RealtimeStore } from "./store";
import type { PersistedWorkspaceState } from "./persistence/state-persistence";

const persistence = (state: { value: PersistedWorkspaceState | null }) => ({
  load: async () => state.value,
  save: async (next: PersistedWorkspaceState) => {
    state.value = next;
  }
});

describe("workspace membership", () => {
  test("owner can invite, update, and remove a member", async () => {
    const store = new RealtimeStore(persistence({ value: null }));
    const document = store.createDocument("Private", "Owner", undefined, "owner");

    expect(
      store.upsertWorkspaceMember({
        kind: "document",
        entityId: document.id,
        ownerId: "owner",
        email: "EDITOR@example.com",
        role: "viewer"
      })
    ).toMatchObject({ email: "editor@example.com", role: "viewer" });

    expect(
      store.upsertWorkspaceMember({
        kind: "document",
        entityId: document.id,
        ownerId: "owner",
        email: "editor@example.com",
        role: "editor"
      })
    ).toMatchObject({ email: "editor@example.com", role: "editor" });

    expect(
      store.removeWorkspaceMember({
        kind: "document",
        entityId: document.id,
        ownerId: "owner",
        email: "editor@example.com"
      })
    ).toMatchObject({ email: "editor@example.com" });
    expect(store.listWorkspaceMembers("document", document.id)).toEqual([]);
    await store.close();
  });

  test("another account cannot change membership", async () => {
    const store = new RealtimeStore(persistence({ value: null }));
    const document = store.createDocument("Private", "Owner", undefined, "owner");

    expect(
      store.upsertWorkspaceMember({
        kind: "document",
        entityId: document.id,
        ownerId: "other",
        email: "editor@example.com",
        role: "editor"
      })
    ).toBe("forbidden");
    await store.close();
  });

  test("persists ACL fields and restores them", async () => {
    const state: { value: PersistedWorkspaceState | null } = { value: null };
    const store = new RealtimeStore(persistence(state));
    const document = store.createDocument("Private", "Owner", undefined, "owner");
    store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "editor"
    });
    await store.persistNow();

    const restored = new RealtimeStore(persistence(state));
    await restored.init();
    expect(restored.listWorkspaceMembers("document", document.id)).toMatchObject([
      { email: "editor@example.com", role: "editor" }
    ]);
    await store.close();
    await restored.close();
  });
});
