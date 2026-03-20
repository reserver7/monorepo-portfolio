import { navigateToPort } from "@repo/shared-client";

export const navigateToWhiteboardApp = (pathname = "/") => {
  navigateToPort(3001, pathname);
};
