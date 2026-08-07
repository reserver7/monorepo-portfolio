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

export async function signupOpslens(input: { email: string; name: string; password: string }): Promise<OpsLoginResponse> {
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
  return (await response.json()) as OpsLoginResponse;
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

export async function getOpslensUsers(accessToken: string): Promise<OpsAuthUser[]> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/users`, {
    method: "GET",
    headers: authHeaders(accessToken)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsAuthUser[];
}

export async function updateOpslensUser(
  accessToken: string,
  userId: string,
  input: Partial<Pick<OpsAuthUser, "role">> & { isActive?: boolean }
): Promise<OpsAuthUser> {
  const response = await fetch(`${resolveAuthApiUrl()}/auth/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return (await response.json()) as OpsAuthUser;
}
