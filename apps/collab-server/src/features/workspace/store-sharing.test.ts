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

    const initialInvitation = store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "EDITOR@example.com",
      role: "viewer"
    });
    expect(initialInvitation).toMatchObject({
      email: "editor@example.com",
      role: "viewer",
      status: "pending",
      expiresAt: expect.any(String)
    });
    expect(store.listWorkspaceMembers("document", document.id)).toMatchObject([
      { email: "editor@example.com", status: "pending" }
    ]);

    const resentInvitation = store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "editor"
    });
    expect(resentInvitation).toMatchObject({
      email: "editor@example.com",
      role: "editor",
      status: "pending",
      expiresAt: expect.any(String)
    });
    expect(new Date((resentInvitation as { expiresAt: string }).expiresAt).getTime()).toBeGreaterThanOrEqual(
      new Date((initialInvitation as { expiresAt: string }).expiresAt).getTime()
    );

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

  test("invitee can accept or decline only their own invitation", async () => {
    const store = new RealtimeStore(persistence({ value: null }));
    const document = store.createDocument("Private", "Owner", undefined, "owner");
    store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "editor"
    });

    expect(
      store.respondToWorkspaceInvitation({
        kind: "document",
        entityId: document.id,
        email: "other@example.com",
        accountId: "other",
        status: "accepted"
      })
    ).toBe("forbidden");
    expect(
      store.respondToWorkspaceInvitation({
        kind: "document",
        entityId: document.id,
        email: "editor@example.com",
        accountId: "editor",
        status: "accepted"
      })
    ).toMatchObject({ email: "editor@example.com", accountId: "editor", status: "accepted" });
    await store.close();
  });

  test("expired invitation cannot be accepted", async () => {
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
    state.value!.documents[0]!.members![0]!.expiresAt = "2020-01-01T00:00:00.000Z";

    const restored = new RealtimeStore(persistence(state));
    await restored.init();
    expect(
      restored.respondToWorkspaceInvitation({
        kind: "document",
        entityId: document.id,
        email: "editor@example.com",
        accountId: "editor",
        status: "accepted"
      })
    ).toBe("forbidden");
    await store.close();
    await restored.close();
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

  test("owner can change an accepted member role but not a pending invitation", async () => {
    const store = new RealtimeStore(persistence({ value: null }));
    const document = store.createDocument("Private", "Owner", undefined, "owner");
    store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "viewer"
    });
    store.respondToWorkspaceInvitation({
      kind: "document",
      entityId: document.id,
      email: "editor@example.com",
      accountId: "editor",
      status: "accepted"
    });

    expect(
      store.updateWorkspaceMemberRole({
        kind: "document",
        entityId: document.id,
        ownerId: "owner",
        email: "editor@example.com",
        role: "editor"
      })
    ).toMatchObject({ email: "editor@example.com", role: "editor", status: "accepted" });
    expect(
      store.updateWorkspaceMemberRole({
        kind: "document",
        entityId: document.id,
        ownerId: "other",
        email: "editor@example.com",
        role: "viewer"
      })
    ).toBe("forbidden");

    const pending = store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "pending@example.com",
      role: "viewer"
    });
    expect(
      store.updateWorkspaceMemberRole({
        kind: "document",
        entityId: document.id,
        ownerId: "owner",
        email: "pending@example.com",
        role: "editor"
      })
    ).toBe("forbidden");
    expect(pending).toMatchObject({ status: "pending", role: "viewer" });
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

  test("records membership activity in newest-first order", async () => {
    const store = new RealtimeStore(persistence({ value: null }));
    const document = store.createDocument("Private", "Owner", undefined, "owner");
    store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "viewer"
    });
    store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "editor"
    });
    store.respondToWorkspaceInvitation({
      kind: "document",
      entityId: document.id,
      email: "editor@example.com",
      accountId: "editor",
      status: "accepted"
    });
    store.updateWorkspaceMemberRole({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "viewer"
    });
    store.removeWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com"
    });

    expect(store.listWorkspaceActivity("document", document.id)).toMatchObject([
      { action: "removed", memberEmail: "editor@example.com" },
      { action: "role-changed", memberEmail: "editor@example.com" },
      { action: "accepted", memberEmail: "editor@example.com" },
      { action: "resent", memberEmail: "editor@example.com" },
      { action: "invited", memberEmail: "editor@example.com" }
    ]);
    await store.close();
  });

  test("accepted member can leave but owner cannot", async () => {
    const store = new RealtimeStore(persistence({ value: null }));
    const document = store.createDocument("Private", "Owner", undefined, "owner");
    store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "viewer"
    });
    store.respondToWorkspaceInvitation({
      kind: "document",
      entityId: document.id,
      email: "editor@example.com",
      accountId: "editor",
      status: "accepted"
    });

    expect(
      store.leaveWorkspaceMember({
        kind: "document",
        entityId: document.id,
        accountId: "editor",
        email: "editor@example.com"
      })
    ).toMatchObject({ email: "editor@example.com", status: "accepted" });
    expect(store.listWorkspaceMembers("document", document.id)).toEqual([]);
    expect(store.listWorkspaceActivity("document", document.id)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "left", memberEmail: "editor@example.com", actorId: "editor" })
      ])
    );
    expect(
      store.leaveWorkspaceMember({
        kind: "document",
        entityId: document.id,
        accountId: "owner",
        email: "owner@example.com"
      })
    ).toBe("forbidden");
    await store.close();
  });

  test("owner can transfer ownership to an accepted member", async () => {
    const store = new RealtimeStore(persistence({ value: null }));
    const document = store.createDocument("Private", "Owner", undefined, "owner");
    store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "editor"
    });
    store.respondToWorkspaceInvitation({
      kind: "document",
      entityId: document.id,
      email: "editor@example.com",
      accountId: "editor",
      status: "accepted"
    });

    expect(
      store.transferWorkspaceOwnership({
        kind: "document",
        entityId: document.id,
        ownerId: "owner",
        ownerEmail: "owner@example.com",
        targetEmail: "editor@example.com"
      })
    ).toMatchObject({ ownerId: "editor" });
    expect(store.getDocument(document.id)).toMatchObject({ ownerId: "editor" });
    expect(store.listWorkspaceMembers("document", document.id)).toMatchObject([
      { accountId: "owner", email: "owner@example.com", role: "editor", status: "accepted" }
    ]);
    expect(store.listWorkspaceActivity("document", document.id)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "ownership-transferred",
          memberEmail: "editor@example.com",
          actorId: "owner"
        })
      ])
    );
    await store.close();
  });

  test("stores membership notifications and marks only the recipient notification as read", async () => {
    const store = new RealtimeStore(persistence({ value: null }));
    const document = store.createDocument("Private", "Owner", undefined, "owner");
    store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "viewer"
    });
    store.respondToWorkspaceInvitation({
      kind: "document",
      entityId: document.id,
      email: "editor@example.com",
      accountId: "editor",
      status: "accepted"
    });
    store.updateWorkspaceMemberRole({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "editor"
    });
    store.updateWorkspaceMemberRole({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "viewer"
    });

    const notifications = store.listWorkspaceNotifications("editor");
    expect(notifications).toHaveLength(2);
    expect(notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipientId: "editor",
          action: "role-changed",
          entityId: document.id
        })
      ])
    );
    expect(store.listWorkspaceNotifications("other")).toEqual([]);
    expect(store.markWorkspaceNotificationsRead("editor")).toBe(2);
    expect(store.listWorkspaceNotifications("editor").every((notification) => notification.readAt)).toBe(
      true
    );
    await store.close();
  });

  test("creates a notification for an accepted member mentioned in a comment", async () => {
    const store = new RealtimeStore(persistence({ value: null }));
    const document = store.createDocument("Private", "Owner", undefined, "owner");
    store.upsertWorkspaceMember({
      kind: "document",
      entityId: document.id,
      ownerId: "owner",
      email: "editor@example.com",
      role: "editor"
    });
    store.respondToWorkspaceInvitation({
      kind: "document",
      entityId: document.id,
      email: "editor@example.com",
      accountId: "editor",
      status: "accepted"
    });

    const recipients = store.createMentionNotifications(document.id, ["editor"], "owner", "comment-1");

    expect(recipients).toEqual(["editor"]);
    expect(store.listWorkspaceNotifications("editor")).toMatchObject([
      {
        action: "mentioned",
        recipientId: "editor",
        memberEmail: "editor@example.com",
        commentId: "comment-1"
      }
    ]);
    expect(
      store.createMentionNotifications(document.id, ["editor"], "owner", "comment-2", ["editor"])
    ).toEqual([]);
    await store.close();
  });
});
