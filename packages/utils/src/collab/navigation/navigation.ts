import { trimTrailingSlash } from "../../string/trim-trailing-slash";
import { getGlobalWindow } from "../../runtime/browser";
import { isLocalHost } from "../../runtime/network";

export interface NavigateToAppOptions {
  pathname?: string;
  targetOrigin?: string;
  localPort?: number;
}

type BrowserWindowLike = {
  location: {
    protocol: string;
    hostname: string;
    assign: (url: string) => void;
  };
  localStorage: {
    getItem: (key: string) => string | null;
  };
  name: string;
};

const THEME_STORAGE_KEY = "collab-theme";
const WINDOW_NAME_THEME_PREFIX = "__collab_theme__:";
const THEME_QUERY_KEY = "theme";

const normalizePathname = (pathname: string): string => {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
};

const normalizeOrigin = (rawOrigin: string | undefined): string | null => {
  const value = rawOrigin?.trim();
  if (!value) {
    return null;
  }

  return trimTrailingSlash(value);
};

const getBrowserWindow = (): BrowserWindowLike | null => {
  const target = getGlobalWindow<Partial<BrowserWindowLike>>();
  if (!target?.location || !target.localStorage) {
    return null;
  }

  return target as BrowserWindowLike;
};

const urlFromPort = (browserWindow: BrowserWindowLike, port: number, pathname: string): string => {
  return `${browserWindow.location.protocol}//${browserWindow.location.hostname}:${port}${pathname}`;
};

const readCurrentTheme = (browserWindow: BrowserWindowLike): "light" | "dark" | "system" | null => {
  const value = browserWindow.localStorage.getItem(THEME_STORAGE_KEY)?.trim();
  return value === "light" || value === "dark" || value === "system" ? value : null;
};

const withThemeQuery = (
  browserWindow: BrowserWindowLike,
  destinationUrl: string
): string => {
  const currentTheme = readCurrentTheme(browserWindow);
  if (!currentTheme) {
    return destinationUrl;
  }

  const parsed = new URL(destinationUrl);
  parsed.searchParams.set(THEME_QUERY_KEY, currentTheme);
  return parsed.toString();
};

const writeThemeBridge = (browserWindow: BrowserWindowLike): void => {
  const currentTheme = readCurrentTheme(browserWindow);
  if (!currentTheme) {
    return;
  }

  if (browserWindow.name.length > 0 && !browserWindow.name.startsWith(WINDOW_NAME_THEME_PREFIX)) {
    return;
  }

  browserWindow.name = `${WINDOW_NAME_THEME_PREFIX}${currentTheme}`;
};

export const navigateToApp = ({ pathname = "/", targetOrigin, localPort }: NavigateToAppOptions): void => {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return;
  }

  writeThemeBridge(browserWindow);

  const normalizedPathname = normalizePathname(pathname);
  const normalizedTargetOrigin = normalizeOrigin(targetOrigin);
  const onLocalHost = isLocalHost(browserWindow.location.hostname);
  let destinationUrl: string | null = null;

  if (onLocalHost && localPort) {
    destinationUrl = urlFromPort(browserWindow, localPort, normalizedPathname);
  }

  if (!destinationUrl && normalizedTargetOrigin) {
    destinationUrl = `${normalizedTargetOrigin}${normalizedPathname}`;
  }

  if (!destinationUrl && localPort) {
    destinationUrl = urlFromPort(browserWindow, localPort, normalizedPathname);
  }

  if (!destinationUrl) {
    return;
  }

  browserWindow.location.assign(withThemeQuery(browserWindow, destinationUrl));
};

export const navigateToPort = (port: number, pathname = "/"): void => {
  navigateToApp({ localPort: port, pathname });
};
