const DEFAULT_DOCS_BASE_PATH = "/docs";
const DEFAULT_WHITEBOARD_BASE_PATH = "/whiteboard";

const normalizePath = (basePath: string, pathname = "/"): string => {
  if (pathname === "/") {
    return basePath;
  }

  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${basePath}${normalizedPathname}`;
};

export const getDocsPath = (pathname = "/") => normalizePath(DEFAULT_DOCS_BASE_PATH, pathname);

export const getWhiteboardPath = (pathname = "/") => normalizePath(DEFAULT_WHITEBOARD_BASE_PATH, pathname);
