const WHITEBOARD_PORT = 3001;

export const navigateToWhiteboardApp = (pathname = "/") => {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const targetUrl = `${window.location.protocol}//${window.location.hostname}:${WHITEBOARD_PORT}${normalizedPath}`;
  window.location.assign(targetUrl);
};
