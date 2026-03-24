export interface NavigateToAppOptions {
  pathname?: string;
  targetOrigin?: string;
  localPort?: number;
}

const THEME_STORAGE_KEY = "collab-theme";
const WINDOW_NAME_THEME_PREFIX = "__collab_theme__:";

const normalizePathname = (pathname: string): string => {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
};

const normalizeOrigin = (rawOrigin: string | undefined): string | null => {
  const value = rawOrigin?.trim();
  if (!value) {
    return null;
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const isLocalHost = (hostname: string): boolean => {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
};

const urlFromPort = (port: number, pathname: string): string => {
  return `${window.location.protocol}//${window.location.hostname}:${port}${pathname}`;
};

const readCurrentTheme = (): "light" | "dark" | "system" | null => {
  const value = window.localStorage.getItem(THEME_STORAGE_KEY)?.trim();
  return value === "light" || value === "dark" || value === "system" ? value : null;
};

const writeThemeBridge = (): void => {
  const currentTheme = readCurrentTheme();
  if (!currentTheme) {
    return;
  }

  if (window.name.length > 0 && !window.name.startsWith(WINDOW_NAME_THEME_PREFIX)) {
    return;
  }

  window.name = `${WINDOW_NAME_THEME_PREFIX}${currentTheme}`;
};

export const navigateToApp = ({ pathname = "/", targetOrigin, localPort }: NavigateToAppOptions): void => {
  if (typeof window === "undefined") {
    return;
  }

  writeThemeBridge();

  const normalizedPathname = normalizePathname(pathname);
  const normalizedTargetOrigin = normalizeOrigin(targetOrigin);
  const onLocalHost = isLocalHost(window.location.hostname);

  if (onLocalHost && localPort) {
    window.location.assign(urlFromPort(localPort, normalizedPathname));
    return;
  }

  if (normalizedTargetOrigin) {
    window.location.assign(`${normalizedTargetOrigin}${normalizedPathname}`);
    return;
  }

  if (localPort) {
    window.location.assign(urlFromPort(localPort, normalizedPathname));
  }
};

export const navigateToPort = (port: number, pathname = "/"): void => {
  navigateToApp({ localPort: port, pathname });
};
