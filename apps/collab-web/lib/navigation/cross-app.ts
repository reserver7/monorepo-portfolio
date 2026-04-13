import { navigateToApp } from "@repo/utils/collab";

const DEFAULT_DOCS_BASE_PATH = "/docs";
const DEFAULT_WHITEBOARD_BASE_PATH = "/whiteboard";
const docsBasePath = DEFAULT_DOCS_BASE_PATH;
const whiteboardBasePath = DEFAULT_WHITEBOARD_BASE_PATH;

export const navigateToDocsApp = (pathname = "/") => {
  const normalizedPathname = pathname === "/" ? docsBasePath : `${docsBasePath}${pathname}`;
  navigateToApp({
    pathname: normalizedPathname,
    localPort: 3000,
    targetOrigin: docsBasePath
  });
};

export const navigateToWhiteboardApp = (pathname = "/") => {
  const normalizedPathname = pathname === "/" ? whiteboardBasePath : `${whiteboardBasePath}${pathname}`;
  navigateToApp({
    pathname: normalizedPathname,
    localPort: 3000,
    targetOrigin: whiteboardBasePath
  });
};
