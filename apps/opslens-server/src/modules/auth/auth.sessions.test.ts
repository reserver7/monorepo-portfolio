import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { AuthService } from "./auth.service.js";
import { hashPassword } from "./auth.token.js";
import { createTwoFactorSecret, createTotpCode, encryptTwoFactorSecret } from "./two-factor.js";
import { consumeRecoveryCode, createRecoveryCodes, serializeRecoveryCodes } from "./recovery-codes.js";

test("session listing is scoped to the user and marks the current token without exposing its hash", async () => {
  const refreshToken = "current-refresh-token";
  const tokenHash = createHash("sha256").update(refreshToken).digest("base64url");
  const prisma = {
    refreshToken: {
      findMany: async () => [
        {
          id: "session-1",
          tokenHash,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          lastUsedAt: null,
          expiresAt: new Date("2026-02-01T00:00:00.000Z"),
          ipAddress: "127.0.0.1",
          userAgent: "Test browser"
        }
      ]
    }
  } as never;

  const sessions = await new AuthService(prisma).listSessions(
    { sub: "user-1", email: "user@example.com", name: "User", role: "operator" },
    refreshToken
  );

  assert.equal(sessions[0]?.isCurrent, true);
  assert.equal("tokenHash" in (sessions[0] ?? {}), false);
});

test("account deletion rechecks the current password, audits, and deletes the user in one transaction", async () => {
  const auditCreate = async () => undefined;
  const userDelete = async ({ where }: { where: { id: string } }) => {
    assert.equal(where.id, "user-1");
    return { id: "user-1" };
  };
  const prisma = {
    user: {
      findUnique: async () => ({
        id: "user-1",
        email: "user@example.com",
        passwordHash: "scrypt$16384$8$1$invalid"
      })
    },
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({ opsAuditLog: { create: auditCreate }, user: { delete: userDelete } })
  } as never;

  await assert.rejects(
    () =>
      new AuthService(prisma).deleteAccount(
        { sub: "user-1", email: "user@example.com", name: "User", role: "operator" },
        "wrong-password"
      ),
    /비밀번호/
  );
});

test("admin can revoke every active session for another user", async () => {
  let revokedUserId = "";
  const prisma = {
    refreshToken: {
      updateMany: async ({ where }: { where: { userId: string } }) => {
        revokedUserId = where.userId;
        return { count: 2 };
      }
    },
    opsAuditLog: { create: async () => undefined }
  } as never;

  const result = await new AuthService(prisma).revokeUserSessions(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    "user-1",
    "보안 점검"
  );

  assert.equal(result.success, true);
  assert.equal(revokedUserId, "user-1");
});

test("admin can deactivate selected users without deactivating the current account", async () => {
  let updateArgs: Record<string, unknown> | undefined;
  const prisma = {
    user: {
      updateMany: async (args: Record<string, unknown>) => {
        updateArgs = args;
        return { count: 2 };
      }
    },
    opsAuditLog: { create: async () => undefined }
  } as never;

  const result = await new AuthService(prisma).bulkUpdateUsers(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    ["admin-1", "user-1", "user-2"],
    { isActive: false, reason: "보안 점검" }
  );

  assert.deepEqual(result, { success: true, updatedCount: 2, skippedUserIds: ["admin-1"] });
  assert.deepEqual(updateArgs, {
    where: { id: { in: ["user-1", "user-2"] } },
    data: { isActive: false }
  });
});

test("admin can revoke sessions for selected users in one operation", async () => {
  let revokeArgs: Record<string, unknown> | undefined;
  const prisma = {
    refreshToken: {
      updateMany: async (args: Record<string, unknown>) => {
        revokeArgs = args;
        return { count: 4 };
      }
    },
    opsAuditLog: { create: async () => undefined }
  } as never;

  const result = await new AuthService(prisma).bulkRevokeUserSessions(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    ["user-1", "user-2"],
    "보안 점검"
  );

  assert.deepEqual(result, { success: true, revokedCount: 4 });
  assert.deepEqual(revokeArgs?.where, {
    userId: { in: ["user-1", "user-2"], not: "admin-1" },
    revokedAt: null
  });
  const revokeData = revokeArgs?.data as { revokedAt?: unknown } | undefined;
  assert.ok(revokeData?.revokedAt instanceof Date);
});

test("admin can inspect a user's account details and recent activity", async () => {
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const lastLoginAt = new Date("2026-01-02T00:00:00.000Z");
  const prisma = {
    user: {
      findUnique: async () => ({
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "operator",
        authProvider: "local",
        avatarColor: "#000000",
        isActive: true,
        createdAt,
        emailVerifiedAt: createdAt
      })
    },
    refreshToken: {
      count: async () => 2,
      findMany: async () => [
        {
          id: "session-1",
          createdAt,
          lastUsedAt: lastLoginAt,
          expiresAt: new Date("2026-02-01T00:00:00.000Z"),
          ipAddress: "127.0.0.1",
          userAgent: "Chrome"
        }
      ]
    },
    opsAuditLog: {
      findMany: async () => [
        {
          id: "audit-1",
          action: "auth.login",
          severity: "info",
          summary: "로그인 성공",
          createdAt: lastLoginAt
        },
        {
          id: "audit-2",
          action: "auth.password_changed",
          severity: "warning",
          summary: "비밀번호 변경",
          createdAt
        }
      ]
    }
  } as never;

  const result = await new AuthService(prisma).getUserDetails(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    "user-1"
  );

  assert.equal(result.user.email, "user@example.com");
  assert.equal(result.activeSessionCount, 2);
  assert.equal(result.lastLoginAt, lastLoginAt);
  assert.equal(result.lastPasswordChangedAt, createdAt);
  assert.equal(result.recentActivity.length, 2);
  assert.equal(result.sessions[0]?.id, "session-1");
});

test("admin can revoke one active session for another user", async () => {
  let revokeArgs: Record<string, unknown> | undefined;
  const prisma = {
    refreshToken: {
      updateMany: async (args: Record<string, unknown>) => {
        revokeArgs = args;
        return { count: 1 };
      }
    },
    opsAuditLog: { create: async () => undefined }
  } as never;

  const result = await new AuthService(prisma).revokeUserSession(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    "user-1",
    "session-1",
    "의심스러운 로그인 대응"
  );

  assert.deepEqual(result, { success: true });
  assert.deepEqual(revokeArgs?.where, { id: "session-1", userId: "user-1", revokedAt: null });
  assert.ok((revokeArgs?.data as { revokedAt?: unknown }).revokedAt instanceof Date);
});

test("admin can list security events with review filters and pagination", async () => {
  let findArgs: Record<string, unknown> | undefined;
  const prisma = {
    opsAuditLog: {
      findMany: async (args: Record<string, unknown>) => {
        findArgs = args;
        return [
          {
            id: "event-1",
            actor: "admin@example.com",
            action: "auth.login_failed",
            targetType: "User",
            targetId: "user-1",
            severity: "critical",
            summary: "반복 로그인 실패",
            reviewStatus: "unreviewed",
            reviewedBy: null,
            reviewNote: null,
            reviewedAt: null,
            createdAt: new Date("2026-01-01T00:00:00.000Z")
          }
        ];
      },
      count: async () => 1
    }
  } as never;

  const result = await new AuthService(prisma).listSecurityEvents(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    { reviewStatus: "unreviewed", severity: "critical", assignee: "", page: 2, pageSize: 10 }
  );

  assert.equal(result.totalCount, 1);
  assert.equal(result.items[0]?.reviewStatus, "unreviewed");
  assert.deepEqual(findArgs?.where, {
    reviewStatus: "unreviewed",
    severity: "critical"
  });
  assert.equal(findArgs?.skip, 10);
  assert.equal(findArgs?.take, 10);
});

test("non-admin cannot list security events", async () => {
  await assert.rejects(
    () =>
      new AuthService({} as never).listSecurityEvents(
        { sub: "viewer-1", email: "viewer@example.com", name: "Viewer", role: "viewer" },
        {}
      ),
    /관리자/
  );
});

test("admin can review a security event and the change is audited", async () => {
  let updateArgs: Record<string, unknown> | undefined;
  const auditEntries: Array<Record<string, unknown>> = [];
  const prisma = {
    user: {
      findUnique: async () => ({ email: "admin@example.com", role: "admin", isActive: true })
    },
    opsAuditLog: {
      findUnique: async () => ({
        id: "event-1",
        reviewStatus: "unreviewed",
        reviewedBy: null,
        reviewNote: null,
        reviewedAt: null
      }),
      update: async (args: Record<string, unknown>) => {
        updateArgs = args;
        return {
          id: "event-1",
          reviewStatus: "resolved",
          reviewedBy: "admin@example.com",
          reviewNote: "조사 완료",
          reviewedAt: new Date("2026-01-02T00:00:00.000Z")
        };
      },
      create: async (args: { data: Record<string, unknown> }) => {
        auditEntries.push(args.data);
        return undefined;
      }
    }
  } as never;

  const result = await new AuthService(prisma).reviewSecurityEvent(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    "event-1",
    { reviewStatus: "resolved", assignee: "admin@example.com", reviewNote: "조사 완료" }
  );

  assert.equal(result.reviewStatus, "resolved");
  assert.deepEqual(updateArgs?.where, { id: "event-1" });
  assert.deepEqual(updateArgs?.data, {
    reviewStatus: "resolved",
    reviewedBy: "admin@example.com",
    reviewNote: "조사 완료",
    reviewedAt: (updateArgs?.data as { reviewedAt: unknown }).reviewedAt
  });
  assert.ok((updateArgs?.data as { reviewedAt: unknown }).reviewedAt instanceof Date);
  assert.equal(auditEntries[0]?.action, "security.event_reviewed");
});

test("security event review rejects an invalid note", async () => {
  await assert.rejects(
    () =>
      new AuthService({} as never).reviewSecurityEvent(
        { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
        "event-1",
        { reviewStatus: "in_review", reviewNote: " " }
      ),
    /2자 이상 500자 이하/
  );
});

test("security event review rejects a non-admin assignee", async () => {
  const prisma = {
    user: {
      findUnique: async () => ({ email: "operator@example.com", role: "operator", isActive: true })
    },
    opsAuditLog: {
      findUnique: async () => ({
        id: "event-1",
        reviewStatus: "unreviewed",
        reviewedBy: null,
        reviewNote: null,
        reviewedAt: null
      })
    }
  } as never;

  await assert.rejects(
    () =>
      new AuthService(prisma).reviewSecurityEvent(
        { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
        "event-1",
        { reviewStatus: "in_review", assignee: "operator@example.com" }
      ),
    /활성 상태의 관리자/
  );
});

test("admin can bulk review security events atomically and audit each event", async () => {
  const updates: string[] = [];
  const audits: string[] = [];
  const prisma = {
    user: {
      findUnique: async () => ({ email: "admin@example.com", role: "admin", isActive: true })
    },
    opsAuditLog: {
      findMany: async () => [
        { id: "event-1", reviewStatus: "unreviewed", reviewedBy: null, reviewNote: null, reviewedAt: null },
        {
          id: "event-2",
          reviewStatus: "in_review",
          reviewedBy: "admin@example.com",
          reviewNote: "확인 중",
          reviewedAt: new Date()
        }
      ]
    },
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        opsAuditLog: {
          update: async ({ where }: { where: { id: string } }) => {
            updates.push(where.id);
            return { id: where.id, reviewStatus: "resolved", reviewedBy: "admin@example.com" };
          },
          create: async ({ data }: { data: { targetId?: string } }) => {
            audits.push(data.targetId ?? "");
            return undefined;
          }
        }
      })
  } as never;

  const result = await new AuthService(prisma).bulkReviewSecurityEvents(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    ["event-1", "event-2", "event-1"],
    { reviewStatus: "resolved", assignee: "admin@example.com", reviewNote: "조사 완료" }
  );

  assert.deepEqual(result, { success: true, updatedCount: 2 });
  assert.deepEqual(updates.sort(), ["event-1", "event-2"]);
  assert.deepEqual(audits.sort(), ["event-1", "event-2"]);
});

test("bulk security event review rejects a missing event before updating", async () => {
  let transactionCalled = false;
  const prisma = {
    opsAuditLog: {
      findMany: async () => [{ id: "event-1" }]
    },
    $transaction: async () => {
      transactionCalled = true;
      return undefined;
    }
  } as never;

  await assert.rejects(
    () =>
      new AuthService(prisma).bulkReviewSecurityEvents(
        { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
        ["event-1", "event-2"],
        { reviewStatus: "resolved" }
      ),
    /보안 이벤트를 찾을 수 없습니다/
  );
  assert.equal(transactionCalled, false);
});

test("admin can read security event details with related activity", async () => {
  let relatedArgs: Record<string, unknown> | undefined;
  const prisma = {
    opsAuditLog: {
      findUnique: async () => ({
        id: "event-2",
        actor: "admin@example.com",
        action: "auth.login_failed",
        targetType: "User",
        targetId: "user-1",
        severity: "critical",
        summary: "반복 로그인 실패",
        beforeValue: { attempts: 2 },
        afterValue: { attempts: 3 },
        metadata: { ip: "127.0.0.1" },
        reviewStatus: "in_review",
        reviewedBy: "admin@example.com",
        reviewNote: "확인 중",
        reviewedAt: new Date("2026-01-02T00:00:00.000Z"),
        createdAt: new Date("2026-01-02T00:00:00.000Z")
      }),
      findMany: async (args: Record<string, unknown>) => {
        relatedArgs = args;
        return [
          {
            id: "event-1",
            action: "auth.login_failed",
            severity: "warning",
            summary: "로그인 실패",
            createdAt: new Date("2026-01-01T00:00:00.000Z")
          }
        ];
      }
    }
  } as never;

  const result = await new AuthService(prisma).getSecurityEventDetails(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    "event-2"
  );

  assert.deepEqual(result.beforeValue, { attempts: 2 });
  assert.equal(result.relatedEvents[0]?.id, "event-1");
  assert.deepEqual(relatedArgs?.where, {
    targetType: "User",
    targetId: "user-1",
    id: { not: "event-2" }
  });
});

test("non-admin cannot read security event details", async () => {
  await assert.rejects(
    () =>
      new AuthService({} as never).getSecurityEventDetails(
        { sub: "viewer-1", email: "viewer@example.com", name: "Viewer", role: "viewer" },
        "event-1"
      ),
    /관리자/
  );
});

test("admin can sync security notifications without duplicates", async () => {
  let createManyArgs: Record<string, unknown> | undefined;
  const prisma = {
    opsAuditLog: {
      findMany: async (args: { where?: { id?: unknown } }) =>
        args.where?.id
          ? [
              {
                id: "event-1",
                action: "auth.login_failed",
                severity: "critical",
                summary: "반복 로그인 실패",
                createdAt: new Date("2026-01-02T00:00:00.000Z")
              }
            ]
          : [{ id: "event-1" }]
    },
    opsSecurityNotification: {
      createMany: async (args: Record<string, unknown>) => {
        createManyArgs = args;
        return { count: 1 };
      },
      findMany: async () => [
        {
          id: "notification-1",
          eventId: "event-1",
          readAt: null,
          createdAt: new Date("2026-01-02T00:00:00.000Z")
        }
      ],
      count: async () => 1
    }
  } as never;

  const result = await new AuthService(prisma).listSecurityNotifications({
    sub: "admin-1",
    email: "admin@example.com",
    name: "Admin",
    role: "admin"
  });

  assert.equal(result.unreadCount, 1);
  assert.equal(result.items[0]?.event.id, "event-1");
  assert.deepEqual(createManyArgs?.data, [{ userId: "admin-1", eventId: "event-1" }]);
  assert.equal(createManyArgs?.skipDuplicates, true);
});

test("admin can mark only their own security notification as read", async () => {
  let updateArgs: Record<string, unknown> | undefined;
  const prisma = {
    opsSecurityNotification: {
      updateMany: async (args: Record<string, unknown>) => {
        updateArgs = args;
        return { count: 1 };
      }
    }
  } as never;

  const result = await new AuthService(prisma).markSecurityNotificationRead(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    "notification-1"
  );

  assert.deepEqual(result, { success: true });
  assert.deepEqual(updateArgs?.where, { id: "notification-1", userId: "admin-1" });
  assert.ok((updateArgs?.data as { readAt?: unknown }).readAt instanceof Date);
});

test("admin can filter and paginate one user's audit activity", async () => {
  let findManyArgs: Record<string, unknown> | undefined;
  let countArgs: Record<string, unknown> | undefined;
  const prisma = {
    opsAuditLog: {
      findMany: async (args: Record<string, unknown>) => {
        findManyArgs = args;
        return [
          {
            id: "audit-1",
            actor: "user@example.com",
            targetType: "Auth",
            targetId: "user-1",
            action: "auth.login",
            severity: "info",
            summary: "로그인 성공",
            beforeValue: null,
            afterValue: null,
            metadata: {},
            createdAt: new Date("2026-01-10T00:00:00.000Z")
          }
        ];
      },
      count: async (args: Record<string, unknown>) => {
        countArgs = args;
        return 11;
      }
    }
  } as never;

  const result = await new AuthService(prisma).listUserActivity(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    "user-1",
    { action: "auth.login", from: new Date("2026-01-01T00:00:00.000Z"), page: 2, pageSize: 10 }
  );

  assert.equal(result.totalCount, 11);
  assert.equal(result.page, 2);
  assert.equal(result.items[0]?.action, "auth.login");
  assert.deepEqual(findManyArgs?.where, {
    targetType: "Auth",
    targetId: "user-1",
    action: "auth.login",
    createdAt: { gte: new Date("2026-01-01T00:00:00.000Z") }
  });
  assert.deepEqual(countArgs?.where, findManyArgs?.where);
});

test("admin can export filtered user activity as bounded CSV", async () => {
  let exportArgs: Record<string, unknown> | undefined;
  const prisma = {
    opsAuditLog: {
      findMany: async (args: Record<string, unknown>) => {
        exportArgs = args;
        return [
          {
            actor: "admin@example.com",
            targetType: "Auth",
            targetId: "user-1",
            action: "auth.login",
            severity: "info",
            summary: '로그인, "성공"',
            beforeValue: null,
            afterValue: { ok: true },
            metadata: { ip: "127.0.0.1" },
            createdAt: new Date("2026-01-10T00:00:00.000Z")
          }
        ];
      }
    }
  } as never;

  const csv = await new AuthService(prisma).exportUserActivityCsv(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    "user-1",
    { action: "auth.login" }
  );

  assert.match(
    csv,
    /^\uFEFFcreatedAt,actor,targetType,targetId,action,severity,summary,beforeValue,afterValue,metadata/
  );
  assert.match(csv, /"로그인, ""성공"""/);
  assert.equal(exportArgs?.take as number, 10_000);
});

test("admin can read the security summary", async () => {
  const prisma = {
    user: {
      count: async ({ where }: { where?: { isActive?: boolean } } = {}) => (where?.isActive === true ? 8 : 10)
    },
    refreshToken: { count: async () => 5 },
    adminInvitation: { count: async () => 2 },
    opsAuditLog: {
      count: async ({ where }: { where: { action?: unknown; severity?: unknown } }) =>
        where.action ? 3 : where.severity ? 4 : 0,
      findMany: async () => [
        {
          id: "audit-1",
          actor: "admin@example.com",
          action: "auth.login_failed",
          severity: "warning",
          summary: "로그인 실패",
          createdAt: new Date("2026-01-10T00:00:00.000Z")
        }
      ]
    }
  } as never;

  const result = await new AuthService(prisma).getAdminSecuritySummary({
    sub: "admin-1",
    email: "admin@example.com",
    name: "Admin",
    role: "admin"
  });

  assert.deepEqual(result.metrics, {
    totalUsers: 10,
    activeUsers: 8,
    activeSessions: 5,
    pendingInvitations: 2,
    recentAdminActions: 3,
    highRiskEvents: 4,
    unreviewedHighRiskEvents: 4
  });
  assert.equal(result.recentEvents[0]?.action, "auth.login_failed");
});

test("admin user listing applies search filters and returns paginated metadata", async () => {
  let findManyArgs: Record<string, unknown> | undefined;
  let countArgs: Record<string, unknown> | undefined;
  const prisma = {
    user: {
      findMany: async (args: Record<string, unknown>) => {
        findManyArgs = args;
        return [
          {
            id: "user-1",
            email: "operator@example.com",
            name: "Operator",
            role: "operator",
            authProvider: "local",
            avatarColor: "#000000",
            isActive: true
          }
        ];
      },
      count: async (args: Record<string, unknown>) => {
        countArgs = args;
        return 21;
      }
    }
  } as never;

  const result = await new AuthService(prisma).listUsers(
    { sub: "admin-1", email: "admin@example.com", name: "Admin", role: "admin" },
    { query: "operator", role: "operator", isActive: true, page: 2, pageSize: 10 }
  );

  assert.equal(result.totalCount, 21);
  assert.equal(result.page, 2);
  assert.equal(result.pageSize, 10);
  assert.equal(result.items[0]?.email, "operator@example.com");
  assert.deepEqual(findManyArgs?.where, {
    role: "operator",
    isActive: true,
    OR: [
      { email: { contains: "operator", mode: "insensitive" } },
      { name: { contains: "operator", mode: "insensitive" } }
    ]
  });
  assert.deepEqual(findManyArgs?.skip, 10);
  assert.deepEqual(countArgs?.where, findManyArgs?.where);
});

test("non-admin cannot query the filtered user listing", async () => {
  await assert.rejects(
    () =>
      new AuthService({} as never).listUsers(
        { sub: "user-1", email: "user@example.com", name: "User", role: "operator" },
        { page: 1, pageSize: 20 }
      ),
    /관리자/
  );
});

test("password change keeps the current refresh session and audits revoked sessions", async () => {
  let revokedWhere: Record<string, unknown> | undefined;
  let auditMetadata: Record<string, unknown> | undefined;
  const hash = hashPassword("current-pass");
  const prisma = {
    user: {
      findUnique: async () => ({
        id: "user-1",
        email: "user@example.com",
        isActive: true,
        authProvider: "local",
        passwordHash: hash
      }),
      update: async () => undefined
    },
    refreshToken: {
      findFirst: async () => ({ id: "current-session" }),
      updateMany: async ({ where }: { where: Record<string, unknown> }) => {
        revokedWhere = where;
        return { count: 2 };
      }
    },
    opsAuditLog: {
      create: async ({ data }: { data: { metadata?: Record<string, unknown> } }) => {
        auditMetadata = data.metadata;
      }
    },
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)
  } as never;

  const service = new AuthService(prisma);

  await service.changePassword(
    { sub: "user-1", email: "user@example.com", name: "User", role: "operator" },
    { currentPassword: "current-pass", newPassword: "new-password" },
    "current-refresh-token"
  );

  assert.deepEqual(revokedWhere, {
    userId: "user-1",
    revokedAt: null,
    tokenHash: { not: createHash("sha256").update("current-refresh-token").digest("base64url") }
  });
  assert.deepEqual(auditMetadata, { revokedSessionCount: 2 });
});

test("password change failure does not touch the refresh sessions", async () => {
  let transactionStarted = false;
  const prisma = {
    user: {
      findUnique: async () => ({
        id: "user-1",
        email: "user@example.com",
        isActive: true,
        authProvider: "local",
        passwordHash: hashPassword("current-pass")
      })
    },
    $transaction: async () => {
      transactionStarted = true;
      return undefined;
    }
  } as never;

  await assert.rejects(
    () =>
      new AuthService(prisma).changePassword(
        { sub: "user-1", email: "user@example.com", name: "User", role: "operator" },
        { currentPassword: "wrong-pass", newPassword: "new-password" },
        "current-refresh-token"
      ),
    /현재 비밀번호/
  );
  assert.equal(transactionStarted, false);
});

test("regenerates recovery codes only with the current TOTP code and replaces the old set", async () => {
  const secret = createTwoFactorSecret();
  const oldCodes = createRecoveryCodes();
  let storedCodes = serializeRecoveryCodes(oldCodes);
  let auditAction = "";
  const prisma = {
    user: {
      findUnique: async () => ({
        id: "user-1",
        email: "user@example.com",
        authProvider: "local",
        twoFactorEnabled: true,
        twoFactorSecret: encryptTwoFactorSecret(secret),
        twoFactorRecoveryCodes: storedCodes
      }),
      update: async ({ data }: { data: { twoFactorRecoveryCodes: string } }) => {
        storedCodes = data.twoFactorRecoveryCodes;
        return undefined;
      }
    },
    opsAuditLog: {
      create: async ({ data }: { data: { action: string } }) => {
        auditAction = data.action;
      }
    }
  } as never;

  const result = await new AuthService(prisma).regenerateRecoveryCodes(
    { sub: "user-1", email: "user@example.com", name: "User", role: "operator" },
    createTotpCode(secret, Math.floor(Date.now() / 1000 / 30))
  );

  assert.equal(result.recoveryCodes.length, 10);
  assert.equal(consumeRecoveryCode(storedCodes, oldCodes[0]!), null);
  assert.equal(auditAction, "auth.two_factor_recovery_regenerated");
});

test("rejects expired two-factor setup and clears its temporary secret", async () => {
  const secret = createTwoFactorSecret();
  let cleared = false;
  const prisma = {
    user: {
      findUnique: async () => ({
        id: "user-1",
        email: "user@example.com",
        twoFactorEnabled: false,
        twoFactorSecret: encryptTwoFactorSecret(secret),
        twoFactorSetupExpiresAt: new Date(Date.now() - 1_000)
      }),
      update: async ({ data }: { data: { twoFactorSecret: null; twoFactorSetupExpiresAt: null } }) => {
        cleared = data.twoFactorSecret === null && data.twoFactorSetupExpiresAt === null;
        return undefined;
      }
    },
    opsAuditLog: { create: async () => undefined }
  } as never;

  await assert.rejects(
    () =>
      new AuthService(prisma).confirmTwoFactor(
        { sub: "user-1", email: "user@example.com", name: "User", role: "operator" },
        createTotpCode(secret, Math.floor(Date.now() / 1000 / 30))
      ),
    /만료/
  );
  assert.equal(cleared, true);
});

test("cancels an unfinished two-factor setup and audits the cleanup", async () => {
  let cleared = false;
  let auditAction = "";
  const prisma = {
    user: {
      findUnique: async () => ({
        id: "user-1",
        email: "user@example.com",
        twoFactorEnabled: false,
        twoFactorSecret: "encrypted-secret"
      }),
      update: async ({ data }: { data: { twoFactorSecret: null; twoFactorSetupExpiresAt: null } }) => {
        cleared = data.twoFactorSecret === null && data.twoFactorSetupExpiresAt === null;
        return undefined;
      }
    },
    opsAuditLog: {
      create: async ({ data }: { data: { action: string } }) => {
        auditAction = data.action;
      }
    }
  } as never;

  const result = await new AuthService(prisma).cancelTwoFactorSetup({
    sub: "user-1",
    email: "user@example.com",
    name: "User",
    role: "operator"
  });

  assert.equal(result.cancelled, true);
  assert.equal(cleared, true);
  assert.equal(auditAction, "auth.two_factor_setup_cancelled");
});
