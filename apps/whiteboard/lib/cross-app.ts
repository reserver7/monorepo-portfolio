const DOCS_PORT = 3000;

export const navigateToDocsApp = (pathname = "/") => {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const targetUrl = `${window.location.protocol}//${window.location.hostname}:${DOCS_PORT}${normalizedPath}`;
  window.location.assign(targetUrl);
};
