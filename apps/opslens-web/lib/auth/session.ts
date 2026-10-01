"use client";

import {
  getOpslensNotificationPolicy,
  getOpslensMe,
  requestPasswordResetOpslens,
  resetPasswordOpslens,
  resendOpslensVerification,
  updateOpslensNotificationPolicy,
  updateOpslensProfile,
  type OpsAuthUser,
  type OpsLoginResponse
} from "@repo/opslens";
import type { OpsSignupResponse } from "@repo/opslens";
import { setHttpAccessToken } from "@repo/react-query";

const LEGACY_ROLE_KEY = "opslens.role";
export const OPS_AVATAR_COLOR_CHANGED_EVENT = "opslens:avatar-color-changed";
const DEFAULT_AVATAR_COLOR = "#64748B";
const NOTIFICATION_POLICY_KEY = "opslens.notification-policy";
type SessionStorageMode = "local" | "session";
export type OpsAvatarColor = string;

export type OpsAuthSession = {
  accessToken: string;
  expiresAt: number;
  user: OpsAuthUser;
  storageMode: SessionStorageMode;
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

export type OpsAuthSessionSummary = {
  id: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
};

export type OpsSecurityActivity = {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string | null;
  severity: string;
  summary: string;
  beforeValue: string | null;
  afterValue: string | null;
  metadata: string;
  createdAt: string;
};

const DEFAULT_NOTIFICATION_POLICY: OpsNotificationPolicy = {
  inAppEnabled: true,
  emailEnabled: false,
  slackEnabled: false,
  minLevel: "all",
  quietHoursEnabled: false,
  quietFrom: "22:00",
  quietTo: "08:00"
};

const isBrowser = (): boolean => typeof window !== "undefined";

let memorySession: OpsAuthSession | null = null;

const writeSession = (session: OpsAuthSession, storageMode: SessionStorageMode = "local"): void => {
  memorySession = { ...session, storageMode };
  if (isBrowser()) window.localStorage.setItem(LEGACY_ROLE_KEY, session.user.role);
};

export const clearAuthSession = (): void => {
  memorySession = null;
  if (isBrowser()) {
    window.localStorage.removeItem(LEGACY_ROLE_KEY);
  }
  setHttpAccessToken(null);
};

export const readAuthAvatarColor = (): OpsAvatarColor => {
  const session = readAuthSession();
  return session?.user?.avatarColor ?? DEFAULT_AVATAR_COLOR;
};

export const setAuthAvatarColor = (avatarColor: OpsAvatarColor): void => {
  const session = readAuthSession();
  if (!session || !isBrowser()) return;

  const nextSession: OpsAuthSession = {
    ...session,
    user: {
      ...session.user,
      avatarColor
    }
  };
  writeSession(nextSession);
  window.dispatchEvent(new CustomEvent(OPS_AVATAR_COLOR_CHANGED_EVENT, { detail: { avatarColor } }));
};

export const readAuthSession = (): OpsAuthSession | null => {
  if (!memorySession || memorySession.expiresAt <= Date.now()) return null;
  return memorySession;
};

export const getAuthAccessToken = (): string | null => {
  return readAuthSession()?.accessToken ?? null;
};

const isValidTime = (value: unknown): value is string => {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
};

const normalizeNotificationPolicy = (value: unknown): OpsNotificationPolicy => {
  if (!value || typeof value !== "object") return DEFAULT_NOTIFICATION_POLICY;
  const policy = value as Partial<OpsNotificationPolicy>;
  return {
    inAppEnabled: policy.inAppEnabled ?? DEFAULT_NOTIFICATION_POLICY.inAppEnabled,
    emailEnabled: policy.emailEnabled ?? DEFAULT_NOTIFICATION_POLICY.emailEnabled,
    slackEnabled: policy.slackEnabled ?? DEFAULT_NOTIFICATION_POLICY.slackEnabled,
    minLevel:
      policy.minLevel === "all" || policy.minLevel === "high" || policy.minLevel === "critical"
        ? policy.minLevel
        : DEFAULT_NOTIFICATION_POLICY.minLevel,
    quietHoursEnabled: policy.quietHoursEnabled ?? DEFAULT_NOTIFICATION_POLICY.quietHoursEnabled,
    quietFrom: isValidTime(policy.quietFrom) ? policy.quietFrom : DEFAULT_NOTIFICATION_POLICY.quietFrom,
    quietTo: isValidTime(policy.quietTo) ? policy.quietTo : DEFAULT_NOTIFICATION_POLICY.quietTo
  };
};

export const readNotificationPolicy = (): OpsNotificationPolicy => {
  if (!isBrowser()) return DEFAULT_NOTIFICATION_POLICY;
  const raw = window.localStorage.getItem(NOTIFICATION_POLICY_KEY);
  if (!raw) return DEFAULT_NOTIFICATION_POLICY;
  try {
    return normalizeNotificationPolicy(JSON.parse(raw));
  } catch {
    return DEFAULT_NOTIFICATION_POLICY;
  }
};

export const saveNotificationPolicy = (policy: OpsNotificationPolicy): OpsNotificationPolicy => {
  const normalized = normalizeNotificationPolicy(policy);
  if (isBrowser()) {
    window.localStorage.setItem(NOTIFICATION_POLICY_KEY, JSON.stringify(normalized));
  }
  return normalized;
};

export const fetchNotificationPolicy = async (): Promise<OpsNotificationPolicy> => {
  const session = readAuthSession();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }
  const policy = await getOpslensNotificationPolicy(session.accessToken);
  return saveNotificationPolicy(policy);
};

export const updateNotificationPolicy = async (
  policy: OpsNotificationPolicy
): Promise<OpsNotificationPolicy> => {
  const session = readAuthSession();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }
  const saved = await updateOpslensNotificationPolicy(session.accessToken, policy);
  return saveNotificationPolicy(saved);
};

const requestSession = async <Response = OpsLoginResponse>(
  action: "login" | "signup" | "refresh",
  input: object
): Promise<Response> => {
  const response = await fetch(`/api/opslens-auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error(await parseOAuthBridgeError(response));
  }
  return (await response.json()) as Response;
};

export const saveAuthSession = (
  response: OpsLoginResponse,
  options?: { storageMode?: SessionStorageMode }
): OpsAuthSession => {
  const expiresAt = Date.now() + response.expiresIn * 1000;
  const session: OpsAuthSession = {
    accessToken: response.accessToken,
    expiresAt,
    user: response.user,
    storageMode: options?.storageMode ?? "local"
  };
  writeSession(session, options?.storageMode ?? "local");
  setHttpAccessToken(response.accessToken);
  return session;
};

export const loginWithPassword = async (input: {
  email: string;
  password: string;
  otp?: string;
  rememberMe?: boolean;
}): Promise<OpsAuthSession> => {
  const response = await requestSession("login", input);
  return saveAuthSession(response, { storageMode: input.rememberMe === false ? "session" : "local" });
};

export const signupWithPassword = async (input: {
  email: string;
  name: string;
  password: string;
  next?: string;
}): Promise<OpsSignupResponse> => {
  return requestSession<OpsSignupResponse>("signup", input);
};

export const resendEmailVerification = resendOpslensVerification;

const parseOAuthBridgeError = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    const message = payload.message;
    if (Array.isArray(message)) {
      const joined = message.filter((item) => typeof item === "string").join(", ");
      if (joined.length > 0) return joined;
    }
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  } catch {
    // no-op
  }
  return "OAuth 로그인 처리에 실패했습니다.";
};

export const loginWithOAuth = async (): Promise<OpsAuthSession> => {
  const response = await fetch("/api/auth/opslens-login", {
    method: "POST",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(await parseOAuthBridgeError(response));
  }

  const payload = (await response.json()) as OpsLoginResponse;
  return saveAuthSession(payload, { storageMode: "local" });
};

export const requestPasswordReset = async (input: { email: string }): Promise<void> => {
  await requestPasswordResetOpslens({ email: input.email.trim() });
};

export const resetPassword = resetPasswordOpslens;

export const logoutCurrentSession = async (): Promise<void> => {
  const session = readAuthSession();
  await fetch("/api/opslens-auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session ? { accessToken: session.accessToken } : {})
  }).catch(() => undefined);
  clearAuthSession();
};

export const validateCurrentSession = async (): Promise<OpsAuthSession | null> => {
  const session = readAuthSession();
  if (session) {
    try {
      const user = await getOpslensMe(session.accessToken);
      const verifiedSession: OpsAuthSession = { ...session, user };
      writeSession(verifiedSession, session.storageMode);
      return verifiedSession;
    } catch {
      // Continue with the cookie-backed refresh flow.
    }
  }

  try {
    return saveAuthSession(await requestSession("refresh", {}), {
      storageMode: session?.storageMode ?? "local"
    });
  } catch {
    clearAuthSession();
    return null;
  }
};

export const updateCurrentProfile = async (input: {
  name: string;
  avatarColor?: OpsAvatarColor;
}): Promise<OpsAuthSession> => {
  const session = readAuthSession();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }

  const user = await updateOpslensProfile(session.accessToken, input);
  const nextSession: OpsAuthSession = {
    ...session,
    user
  };
  writeSession(nextSession);
  return nextSession;
};

export const changeCurrentPassword = async (input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  const session = readAuthSession();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }
  const response = await fetch("/api/opslens-auth/password", {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`
    },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await parseOAuthBridgeError(response));
};

const requestSessionManagement = async <Response>(input: {
  method: "GET" | "POST" | "DELETE";
  path?: string;
}): Promise<Response> => {
  const session = readAuthSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  const response = await fetch(`/api/opslens-auth/sessions${input.path ?? ""}`, {
    method: input.method,
    headers: { Accept: "application/json", Authorization: `Bearer ${session.accessToken}` }
  });
  if (!response.ok) throw new Error(await parseOAuthBridgeError(response));
  return (await response.json()) as Response;
};

export const listCurrentSessions = (): Promise<OpsAuthSessionSummary[]> =>
  requestSessionManagement<OpsAuthSessionSummary[]>({ method: "GET" });

export const revokeSession = (sessionId: string): Promise<{ success: true }> =>
  requestSessionManagement<{ success: true }>({
    method: "DELETE",
    path: `/${encodeURIComponent(sessionId)}`
  });

export const revokeAllSessions = (): Promise<{ success: true }> =>
  requestSessionManagement<{ success: true }>({ method: "POST" });

export const deleteCurrentAccount = async (currentPassword: string): Promise<{ success: true }> => {
  const session = readAuthSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  const response = await fetch("/api/opslens-auth/account", {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`
    },
    body: JSON.stringify({ currentPassword })
  });
  if (!response.ok) throw new Error(await parseOAuthBridgeError(response));
  return (await response.json()) as { success: true };
};

export const listSecurityActivity = async (): Promise<OpsSecurityActivity[]> => {
  const session = readAuthSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  const response = await fetch("/api/opslens-auth/security-activity", {
    headers: { Accept: "application/json", Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(await parseOAuthBridgeError(response));
  return (await response.json()) as OpsSecurityActivity[];
};

export const requestEmailChange = async (newEmail: string): Promise<{ sent: boolean; email: string }> => {
  const session = readAuthSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  const response = await fetch("/api/opslens-auth/change-email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`
    },
    body: JSON.stringify({ newEmail: newEmail.trim() })
  });
  if (!response.ok) throw new Error(await parseOAuthBridgeError(response));
  return (await response.json()) as { sent: boolean; email: string };
};

export type TwoFactorSetup = { enabled: boolean; secret?: string; otpauthUri?: string; expiresAt?: string };

const requestTwoFactor = async <Response>(
  method: "GET" | "POST" | "DELETE",
  body?: object
): Promise<Response> => {
  const session = readAuthSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  const response = await fetch("/api/opslens-auth/two-factor", {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${session.accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) throw new Error(await parseOAuthBridgeError(response));
  return (await response.json()) as Response;
};

export const getTwoFactorStatus = (): Promise<{ enabled: boolean }> => requestTwoFactor("GET");
export const setupTwoFactor = (): Promise<TwoFactorSetup> => requestTwoFactor("POST");
export const cancelTwoFactorSetup = async (): Promise<{ cancelled: true }> => {
  const session = readAuthSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  const response = await fetch("/api/opslens-auth/two-factor/setup", {
    method: "DELETE",
    headers: { Accept: "application/json", Authorization: `Bearer ${session.accessToken}` }
  });
  if (!response.ok) throw new Error(await parseOAuthBridgeError(response));
  return (await response.json()) as { cancelled: true };
};
export const confirmTwoFactor = (code: string): Promise<{ enabled: true; recoveryCodes: string[] }> =>
  requestTwoFactor("POST", { code });
export const disableTwoFactor = (code: string): Promise<{ enabled: false }> =>
  requestTwoFactor("DELETE", { code });

export const regenerateRecoveryCodes = async (code: string): Promise<{ recoveryCodes: string[] }> => {
  const session = readAuthSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  const response = await fetch("/api/opslens-auth/two-factor/recovery-codes", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`
    },
    body: JSON.stringify({ code })
  });
  if (!response.ok) throw new Error(await parseOAuthBridgeError(response));
  return (await response.json()) as { recoveryCodes: string[] };
};
