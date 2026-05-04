"use client";

import {
  changeOpslensPassword,
  getOpslensNotificationPolicy,
  getOpslensMe,
  loginOpslens,
  logoutOpslens,
  refreshOpslens,
  requestPasswordResetOpslens,
  signupOpslens,
  updateOpslensNotificationPolicy,
  updateOpslensProfile,
  type OpsAuthUser,
  type OpsLoginResponse
} from "@repo/opslens";
import { setHttpAccessToken } from "@repo/react-query";

const ACCESS_TOKEN_KEY = "opslens.auth.access-token";
const EXPIRES_AT_KEY = "opslens.auth.expires-at";
const USER_KEY = "opslens.auth.user";
const REFRESH_TOKEN_KEY = "opslens.auth.refresh-token";
const LEGACY_ROLE_KEY = "opslens.role";
export const OPS_AVATAR_COLOR_CHANGED_EVENT = "opslens:avatar-color-changed";
const DEFAULT_AVATAR_COLOR = "#64748B";
const NOTIFICATION_POLICY_KEY = "opslens.notification-policy";
type SessionStorageMode = "local" | "session";
export type OpsAvatarColor = string;

export type OpsAuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: OpsAuthUser;
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

const parseSessionFrom = (storage: Storage): OpsAuthSession | null => {
  const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  const expiresAtRaw = storage.getItem(EXPIRES_AT_KEY);
  const userRaw = storage.getItem(USER_KEY);
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
  if (!accessToken || !expiresAtRaw || !userRaw || !refreshToken) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  try {
    const user = JSON.parse(userRaw) as OpsAuthUser;
    if (!user?.id || !user?.email || !user?.name || !user?.role) {
      return null;
    }
    return { accessToken, refreshToken, expiresAt, user };
  } catch {
    return null;
  }
};

const parseSession = (): OpsAuthSession | null => {
  if (!isBrowser()) return null;

  return parseSessionFrom(window.localStorage) ?? parseSessionFrom(window.sessionStorage);
};

const writeSession = (session: OpsAuthSession, storageMode: SessionStorageMode = "local"): void => {
  if (!isBrowser()) return;
  const storage = storageMode === "session" ? window.sessionStorage : window.localStorage;
  const otherStorage = storageMode === "session" ? window.localStorage : window.sessionStorage;

  otherStorage.removeItem(ACCESS_TOKEN_KEY);
  otherStorage.removeItem(EXPIRES_AT_KEY);
  otherStorage.removeItem(USER_KEY);
  otherStorage.removeItem(REFRESH_TOKEN_KEY);

  storage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  storage.setItem(EXPIRES_AT_KEY, String(session.expiresAt));
  storage.setItem(USER_KEY, JSON.stringify(session.user));
  storage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  window.localStorage.setItem(LEGACY_ROLE_KEY, session.user.role);
};

export const clearAuthSession = (): void => {
  if (isBrowser()) {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(EXPIRES_AT_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(EXPIRES_AT_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
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
  const session = parseSession();
  if (!session) {
    clearAuthSession();
    return null;
  }
  return session;
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

export const updateNotificationPolicy = async (policy: OpsNotificationPolicy): Promise<OpsNotificationPolicy> => {
  const session = readAuthSession();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }
  const saved = await updateOpslensNotificationPolicy(session.accessToken, policy);
  return saveNotificationPolicy(saved);
};

export const saveAuthSession = (
  response: OpsLoginResponse,
  options?: { storageMode?: SessionStorageMode }
): OpsAuthSession => {
  const expiresAt = Date.now() + response.expiresIn * 1000;
  const session: OpsAuthSession = {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt,
    user: response.user
  };
  writeSession(session, options?.storageMode ?? "local");
  setHttpAccessToken(response.accessToken);
  return session;
};

export const loginWithPassword = async (input: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<OpsAuthSession> => {
  const response = await loginOpslens(input);
  return saveAuthSession(response, { storageMode: input.rememberMe === false ? "session" : "local" });
};

export const signupWithPassword = async (input: {
  email: string;
  name: string;
  password: string;
}): Promise<OpsAuthSession> => {
  const response = await signupOpslens(input);
  return saveAuthSession(response);
};

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

export const logoutCurrentSession = async (): Promise<void> => {
  const session = readAuthSession();
  if (session) {
    await logoutOpslens(session.accessToken, session.refreshToken);
  }
  clearAuthSession();
};

export const validateCurrentSession = async (): Promise<OpsAuthSession | null> => {
  const session = readAuthSession();
  if (!session) return null;

  try {
    const user = await getOpslensMe(session.accessToken);
    const verifiedSession: OpsAuthSession = { ...session, user };
    writeSession(verifiedSession);
    return verifiedSession;
  } catch {
    try {
      const refreshed = await refreshOpslens(session.refreshToken);
      const next = saveAuthSession(refreshed);
      return next;
    } catch {
      clearAuthSession();
      return null;
    }
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
  await changeOpslensPassword(session.accessToken, input);
};
