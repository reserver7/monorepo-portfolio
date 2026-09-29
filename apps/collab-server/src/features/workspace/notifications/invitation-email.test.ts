import { describe, expect, jest, test } from "@jest/globals";
import { buildWorkspaceInvitationUrl, sendWorkspaceInvitationEmail } from "./invitation-email";

describe("workspace invitation email", () => {
  test("builds a shareable invitation URL", () => {
    expect(
      buildWorkspaceInvitationUrl("https://collab.example/", "document", "doc-1", "Road map", "editor")
    ).toBe("https://collab.example/invite?kind=document&id=doc-1&title=Road%20map&role=editor");
  });

  test("does not call the provider when email sending is disabled", async () => {
    const fetcher = jest.fn();
    const result = await sendWorkspaceInvitationEmail(
      { to: "member@example.com", workspaceTitle: "Docs", inviteUrl: "https://example.com/invite" },
      { enabled: false, apiKey: undefined, from: undefined, fetcher }
    );

    expect(result).toEqual({ sent: false, reason: "disabled" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("stops before the provider when the free monthly limit is reached", async () => {
    const fetcher = jest.fn();
    const result = await sendWorkspaceInvitationEmail(
      { to: "member@example.com", workspaceTitle: "Docs", inviteUrl: "https://example.com/invite" },
      {
        enabled: true,
        apiKey: "test-key",
        from: "Workspace <noreply@example.com>",
        monthlyLimit: 3_000,
        usage: { month: "2026-09", count: 3_000 },
        now: () => new Date("2026-09-22T00:00:00Z"),
        fetcher
      }
    );

    expect(result).toEqual({ sent: false, reason: "monthly-limit" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("sends one email and increments usage within the free limit", async () => {
    const fetcher = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    const usage = { month: "2026-09", count: 2 };
    const result = await sendWorkspaceInvitationEmail(
      { to: "member@example.com", workspaceTitle: "Docs", inviteUrl: "https://example.com/invite" },
      {
        enabled: true,
        apiKey: "test-key",
        from: "Workspace <noreply@example.com>",
        monthlyLimit: 3_000,
        usage,
        now: () => new Date("2026-09-22T00:00:00Z"),
        fetcher
      }
    );

    expect(result).toEqual({ sent: true });
    expect(usage.count).toBe(3);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" })
    );
  });

  test("returns a provider error when the email request fails", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("network unavailable"));
    const result = await sendWorkspaceInvitationEmail(
      { to: "member@example.com", workspaceTitle: "Docs", inviteUrl: "https://example.com/invite" },
      {
        enabled: true,
        apiKey: "test-key",
        from: "Workspace <noreply@example.com>",
        fetcher
      }
    );

    expect(result).toEqual({ sent: false, reason: "provider-error" });
  });
});
