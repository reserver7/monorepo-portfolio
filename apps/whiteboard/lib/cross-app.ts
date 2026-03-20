import { navigateToPort } from "@repo/shared-client";

export const navigateToDocsApp = (pathname = "/") => {
  navigateToPort(3000, pathname);
};
