export const navigateToPort = (port: number, pathname = "/"): void => {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const targetUrl = `${window.location.protocol}//${window.location.hostname}:${port}${normalizedPath}`;
  window.location.assign(targetUrl);
};
