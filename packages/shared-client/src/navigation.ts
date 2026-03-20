export interface NavigateToAppOptions {
  pathname?: string;
  targetOrigin?: string;
  localPort?: number;
}

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

export const navigateToApp = ({ pathname = "/", targetOrigin, localPort }: NavigateToAppOptions): void => {
  if (typeof window === "undefined") {
    return;
  }

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
