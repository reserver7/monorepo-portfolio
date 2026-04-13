export type HttpUnauthorizedContext = {
  status: number;
  method?: string;
  url?: string;
};

type AccessTokenResolver = () => string | null | undefined;
type UnauthorizedListener = (context: HttpUnauthorizedContext) => void;

type AuthState = {
  accessToken: string | null;
  accessTokenResolver?: AccessTokenResolver;
};

const authState: AuthState = {
  accessToken: null
};

const unauthorizedListeners = new Set<UnauthorizedListener>();
const UNAUTHORIZED_NOTIFY_THROTTLE_MS = 1_500;
let lastUnauthorizedNotifiedAt = 0;

export const setHttpAccessToken = (token: string | null | undefined) => {
  const normalized = typeof token === "string" ? token.trim() : "";
  authState.accessToken = normalized.length > 0 ? normalized : null;
};

export const configureHttpAuth = (options: { getAccessToken?: AccessTokenResolver }) => {
  authState.accessTokenResolver = options.getAccessToken;
};

export const resolveHttpAccessToken = (): string | null => {
  const resolvedByResolver = authState.accessTokenResolver?.();
  if (typeof resolvedByResolver === "string" && resolvedByResolver.trim().length > 0) {
    return resolvedByResolver.trim();
  }

  return authState.accessToken;
};

export const subscribeHttpUnauthorized = (listener: UnauthorizedListener): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

export const notifyHttpUnauthorized = (context: HttpUnauthorizedContext) => {
  const now = Date.now();
  if (now - lastUnauthorizedNotifiedAt < UNAUTHORIZED_NOTIFY_THROTTLE_MS) {
    return;
  }
  lastUnauthorizedNotifiedAt = now;

  for (const listener of unauthorizedListeners) {
    listener(context);
  }
};
