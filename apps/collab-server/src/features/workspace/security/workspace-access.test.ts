import { describe, expect, test } from "@jest/globals";
import type { AccountIdentity } from "./account";
import { resolveWorkspacePermission } from "./workspace-access";

const owner: AccountIdentity = {
  id: "account-owner",
  email: "owner@example.com",
  name: "Owner",
  role: "operator"
};

const editor: AccountIdentity = {
  id: "account-editor",
  email: "editor@example.com",
  name: "Editor",
  role: "operator"
};

describe("resolveWorkspacePermission", () => {
  test("returns owner for the record owner", () => {
    expect(
      resolveWorkspacePermission(
        { ownerId: owner.id, members: [{ accountId: editor.id, email: editor.email, role: "viewer" }] },
        owner
      )
    ).toBe("owner");
  });

  test("returns the matching member role", () => {
    expect(
      resolveWorkspacePermission(
        { ownerId: owner.id, members: [{ accountId: editor.id, email: editor.email, role: "editor" }] },
        editor
      )
    ).toBe("editor");
  });

  test("denies pending and declined invitations", () => {
    expect(
      resolveWorkspacePermission(
        { ownerId: owner.id, members: [{ email: editor.email, role: "editor", status: "pending" }] },
        editor
      )
    ).toBe("denied");
    expect(
      resolveWorkspacePermission(
        { ownerId: owner.id, members: [{ email: editor.email, role: "editor", status: "declined" }] },
        editor
      )
    ).toBe("denied");
  });

  test("denies expired invitations", () => {
    expect(
      resolveWorkspacePermission(
        {
          ownerId: owner.id,
          members: [
            { email: editor.email, role: "editor", status: "pending", expiresAt: "2020-01-01T00:00:00.000Z" }
          ]
        },
        editor
      )
    ).toBe("denied");
  });

  test("denies a mismatched account even when the email differs", () => {
    expect(
      resolveWorkspacePermission(
        { ownerId: owner.id, members: [{ accountId: editor.id, email: editor.email, role: "editor" }] },
        { ...editor, id: "other-account", email: "other@example.com" }
      )
    ).toBe("denied");
  });

  test("keeps legacy ownerless records compatible", () => {
    expect(resolveWorkspacePermission({}, editor)).toBe("legacy");
  });
});
