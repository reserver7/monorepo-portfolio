import { navigateToApp } from "@repo/utils/collab";

const DEFAULT_WHITEBOARD_APP_ORIGIN = "https://monorepo-portfolio-whiteboard.vercel.app";
const whiteboardAppOrigin =
  process.env.NEXT_PUBLIC_WHITEBOARD_APP_URL?.trim() || DEFAULT_WHITEBOARD_APP_ORIGIN;

export const navigateToWhiteboardApp = (pathname = "/") => {
  navigateToApp({
    pathname,
    localPort: 3001,
    targetOrigin: whiteboardAppOrigin
  });
};
