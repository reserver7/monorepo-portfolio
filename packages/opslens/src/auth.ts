import { parseErrorMessage, resolveAuthApiUrl } from "./core";

export type AuthRole = "admin" | "operator" | "viewer";
export type AvatarColor = string;

export type OpsAuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  authProvider: "local" | "google" | "github";
  avatarColor: AvatarColor;
  isActive?: boolean;
};

export type OpsUserListResponse = {
  items: OpsAuthUser[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type OpsAuthUserDetails = {
  user: OpsAuthUser & { createdAt: string; emailVerifiedAt: string | null };
  activeSessionCount: number;
  lastLoginAt: string | null;
  lastPasswordChangedAt: string | null;
  recentActivity: Array<{
    id: string;
    action: string;
    severity: string;
    summary: string;
    createdAt: string;
  }>;
  sessions: Array<{
    id: string;
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string;
    ipAddress: string | null;
    userAgent: string | null;
  }>;
};

export type OpsAuthUserActivity = {
  items: Array<{
    id: string;
    actor: string;
    targetType: string;
    targetId: string | null;
    action: string;
    severity: string;
    summary: string;
    beforeValue: unknown;
    afterValue: unknown;
    metadata: unknown;
    createdAt: string;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
};

export type OpsAdminSecuritySummary = {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    activeSessions: number;
    pendingInvitations: number;
    recentAdminActions: number;
    highRiskEvents: number;
    unreviewedHighRiskEvents: number;
  };
  recentEvents: Array<{
    id: string;
    actor: string;
    action: string;
    severity: string;
    summary: string;
    createdAt: string;
  }>;
};

export type OpsSecurityEvent = {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string | null;
  severity: string;
  summary: string;
  reviewStatus: "unreviewed" | "in_review" | "resolved";
  reviewedBy: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type OpsSecurityEventListResponse = {
  items: OpsSecurityEvent[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type OpsSecurityEventDetails = OpsSecurityEvent & {
  beforeValue: unknown;
  afterValue: unknown;
  metadata: unknown;
  relatedEvents: Array<{
    id: string;
    action: string;
    severity: string;
    summary: string;
    createdAt: string;
  }>;
};

export type OpsSecurityNotificationList = {
  unreadCount: number;
  items: Array<{
    id: string;
    eventId: string;
    readAt: string | null;
    createdAt: string;
    event: {
      id: string;
      action: string;
      severity: string;
      summary: string;
      createdAt: string;
    };
  }>;
};

export type OpsAdminInvitation = {
  id: string;
  email: string;
  role: AuthRole;
  expiresAt: string;
  createdAt: string;
  invitedBy: string;
};

const authHeaders = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: "application/json"
});

export type OpsLoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: OpsAuthUser;
};

export type OpsSignupResponse = {
  requiresEmailVerification: true;
  email: string;
  emailDelivery: {
    sent: boolean;
    reason?: "disabled" | "missing-config" | "monthly-limit" | "provider-error" | "already-verified";
  };
};

export type OpsNotificationPolicy = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  slackEnabled: boolean;
  minLevel: "all" | "high" | "critical";
  quietHoursEnabled: boolean;
  quietFrom: string;
  quietTo: string;
};

export async function loginOpslens(input: { email: string; password: string }): Promise<OpsLoginResponse> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as OpsLoginResponse;
}

export async function signupOpslens(input: {
  email: string;
  name: string;
  password: string;
  next?: string;
}): Promise<OpsSignupResponse> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as OpsSignupResponse;
}

export async function resendOpslensVerification(input: {
  email: string;
  next?: string;
}): Promise<OpsSignupResponse["emailDelivery"]> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsSignupResponse["emailDelivery"];
}

export async function requestPasswordResetOpslens(input: { email: string }): Promise<{ success: true }> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as { success: true };
}

export async function resetPasswordOpslens(input: {
  token: string;
  password: string;
}): Promise<{ success: true }> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as { success: true };
}

export async function logoutOpslens(accessToken: string, refreshToken?: string): Promise<void> {
  await fetch(`${resolveAuthApiUrl()}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(refreshToken ? { refreshToken } : {})
  }).catch(() => undefined);
}

export async function refreshOpslens(refreshToken: string): Promise<OpsLoginResponse> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ refreshToken })
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as OpsLoginResponse;
}

export async function getOpslensMe(accessToken: string): Promise<OpsAuthUser> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as OpsAuthUser;
}

export async function updateOpslensProfile(
  accessToken: string,
  input: {
    name: string;
    avatarColor?: AvatarColor;
  }
): Promise<OpsAuthUser> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as OpsAuthUser;
}

export async function changeOpslensPassword(
  accessToken: string,
  input: {
    currentPassword: string;
    newPassword: string;
  }
): Promise<{ success: true }> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/password`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as { success: true };
}

export async function getOpslensNotificationPolicy(accessToken: string): Promise<OpsNotificationPolicy> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/notification-policy`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as OpsNotificationPolicy;
}

export async function updateOpslensNotificationPolicy(
  accessToken: string,
  input: OpsNotificationPolicy
): Promise<OpsNotificationPolicy> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/notification-policy`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as OpsNotificationPolicy;
}

export async function getOpslensUsers(
  accessToken: string,
  input: {
    query?: string;
    role?: AuthRole | "all";
    isActive?: boolean | "all";
    page?: number;
    pageSize?: number;
  } = {}
): Promise<OpsUserListResponse> {
  const params = new URLSearchParams();
  if (input.query?.trim()) params.set("query", input.query.trim());
  if (input.role && input.role !== "all") params.set("role", input.role);
  if (typeof input.isActive === "boolean") params.set("isActive", String(input.isActive));
  if (input.page) params.set("page", String(input.page));
  if (input.pageSize) params.set("pageSize", String(input.pageSize));
  const query = params.toString();
  const response = await fetch(`${resolveAuthApiUrl()}/auth/users${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: authHeaders(accessToken)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsUserListResponse;
}

export async function getOpslensSecuritySummary(accessToken: string): Promise<OpsAdminSecuritySummary> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/security-summary`, {
    method: "GET",
    headers: authHeaders(accessToken)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsAdminSecuritySummary;
}

export async function getOpslensSecurityEvents(
  accessToken: string,
  input: {
    reviewStatus?: OpsSecurityEvent["reviewStatus"] | "all";
    severity?: string;
    assignee?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<OpsSecurityEventListResponse> {
  const params = new URLSearchParams();
  if (input.reviewStatus && input.reviewStatus !== "all") params.set("reviewStatus", input.reviewStatus);
  if (input.severity && input.severity !== "all") params.set("severity", input.severity);
  if (input.assignee?.trim()) params.set("assignee", input.assignee.trim());
  if (input.page) params.set("page", String(input.page));
  if (input.pageSize) params.set("pageSize", String(input.pageSize));
  const query = params.toString();
  const response = await fetch(`${resolveAuthApiUrl()}/auth/security-events${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: authHeaders(accessToken)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsSecurityEventListResponse;
}

export async function getOpslensSecurityEventDetails(
  accessToken: string,
  eventId: string
): Promise<OpsSecurityEventDetails> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/security-events/${encodeURIComponent(eventId)}`, {
    method: "GET",
    headers: authHeaders(accessToken)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsSecurityEventDetails;
}

export async function getOpslensSecurityNotifications(
  accessToken: string
): Promise<OpsSecurityNotificationList> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/security-notifications`, {
    method: "GET",
    headers: authHeaders(accessToken)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsSecurityNotificationList;
}

export async function markOpslensSecurityNotificationRead(
  accessToken: string,
  notificationId: string
): Promise<{ success: true }> {
  const response = await fetch(
    `${resolveAuthApiUrl()}/auth/security-notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH", headers: authHeaders(accessToken) }
  );
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as { success: true };
}

export async function reviewOpslensSecurityEvent(
  accessToken: string,
  eventId: string,
  input: {
    reviewStatus: OpsSecurityEvent["reviewStatus"];
    assignee?: string;
    reviewNote?: string;
  }
): Promise<Pick<OpsSecurityEvent, "id" | "reviewStatus" | "reviewedBy" | "reviewNote" | "reviewedAt">> {
  const response = await fetch(
    `${resolveAuthApiUrl()}/auth/security-events/${encodeURIComponent(eventId)}/review`,
    {
      method: "PATCH",
      headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(input)
    }
  );
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as Pick<
    OpsSecurityEvent,
    "id" | "reviewStatus" | "reviewedBy" | "reviewNote" | "reviewedAt"
  >;
}

export async function bulkReviewOpslensSecurityEvents(
  accessToken: string,
  input: {
    eventIds: string[];
    reviewStatus: OpsSecurityEvent["reviewStatus"];
    assignee?: string;
    reviewNote?: string;
  }
): Promise<{ success: true; updatedCount: number }> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/security-events/bulk-review`, {
    method: "POST",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as { success: true; updatedCount: number };
}

export async function updateOpslensUser(
  accessToken: string,
  userId: string,
  input: Partial<Pick<OpsAuthUser, "role">> & { isActive?: boolean; reason: string }
): Promise<OpsAuthUser> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsAuthUser;
}

export async function getOpslensUserDetails(
  accessToken: string,
  userId: string
): Promise<OpsAuthUserDetails> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/users/${encodeURIComponent(userId)}/details`, {
    method: "GET",
    headers: authHeaders(accessToken)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsAuthUserDetails;
}

export async function getOpslensUserActivity(
  accessToken: string,
  userId: string,
  input: { action?: string; from?: string; to?: string; page?: number; pageSize?: number } = {}
): Promise<OpsAuthUserActivity> {
  const params = new URLSearchParams();
  if (input.action && input.action !== "all") params.set("action", input.action);
  if (input.from) params.set("from", input.from);
  if (input.to) params.set("to", input.to);
  if (input.page) params.set("page", String(input.page));
  if (input.pageSize) params.set("pageSize", String(input.pageSize));
  const query = params.toString();
  const response = await fetch(
    `${resolveAuthApiUrl()}/auth/users/${encodeURIComponent(userId)}/activity${query ? `?${query}` : ""}`,
    { method: "GET", headers: authHeaders(accessToken) }
  );
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsAuthUserActivity;
}

export async function exportOpslensUserActivityCsv(
  accessToken: string,
  userId: string,
  input: { action?: string; from?: string; to?: string } = {}
): Promise<string> {
  const params = new URLSearchParams();
  if (input.action && input.action !== "all") params.set("action", input.action);
  if (input.from) params.set("from", input.from);
  if (input.to) params.set("to", input.to);
  const query = params.toString();
  const response = await fetch(
    `${resolveAuthApiUrl()}/auth/users/${encodeURIComponent(userId)}/activity/export${query ? `?${query}` : ""}`,
    { method: "GET", headers: authHeaders(accessToken) }
  );
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return response.text();
}

export async function revokeOpslensUserSessions(
  accessToken: string,
  userId: string,
  reason: string
): Promise<{ success: true }> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/users/${encodeURIComponent(userId)}/logout-all`, {
    method: "POST",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as { success: true };
}

export async function revokeOpslensUserSession(
  accessToken: string,
  userId: string,
  sessionId: string,
  reason: string
): Promise<{ success: true }> {
  const response = await fetch(
    `${resolveAuthApiUrl()}/auth/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}/logout`,
    {
      method: "POST",
      headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    }
  );
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as { success: true };
}

export async function bulkUpdateOpslensUsers(
  accessToken: string,
  input: { userIds: string[]; isActive: boolean; reason: string }
): Promise<{ success: true; updatedCount: number; skippedUserIds: string[] }> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/users/bulk/status`, {
    method: "POST",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as { success: true; updatedCount: number; skippedUserIds: string[] };
}

export async function bulkRevokeOpslensUserSessions(
  accessToken: string,
  userIds: string[],
  reason: string
): Promise<{ success: true; revokedCount: number }> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/users/bulk/logout-all`, {
    method: "POST",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({ userIds, reason })
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as { success: true; revokedCount: number };
}

export async function getOpslensInvitations(accessToken: string): Promise<OpsAdminInvitation[]> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/invitations`, {
    method: "GET",
    headers: authHeaders(accessToken)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsAdminInvitation[];
}

export async function inviteOpslensUser(
  accessToken: string,
  input: { email: string; role: AuthRole }
): Promise<{
  id: string;
  email: string;
  role: AuthRole;
  emailDelivery: { sent: boolean };
  inviteUrl: string;
}> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/invitations`, {
    method: "POST",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as {
    id: string;
    email: string;
    role: AuthRole;
    emailDelivery: { sent: boolean };
    inviteUrl: string;
  };
}

export async function resendOpslensInvitation(
  accessToken: string,
  invitationId: string
): Promise<{ success: true; inviteUrl: string; emailDelivery: { sent: boolean } }> {
  const response = await fetch(
    `${resolveAuthApiUrl()}/auth/invitations/${encodeURIComponent(invitationId)}/resend`,
    { method: "POST", headers: authHeaders(accessToken) }
  );
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as {
    success: true;
    inviteUrl: string;
    emailDelivery: { sent: boolean };
  };
}

export async function revokeOpslensInvitation(
  accessToken: string,
  invitationId: string
): Promise<{ success: true }> {
  const response = await fetch(
    `${resolveAuthApiUrl()}/auth/invitations/${encodeURIComponent(invitationId)}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken)
    }
  );
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as { success: true };
}
