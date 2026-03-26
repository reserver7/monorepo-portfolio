import { navigateToApp } from "@repo/collab-client";

const DEFAULT_DOCS_APP_ORIGIN = "https://monorepo-portfolio-docs.vercel.app";
const docsAppOrigin = process.env.NEXT_PUBLIC_DOCS_APP_URL?.trim() || DEFAULT_DOCS_APP_ORIGIN;

export const navigateToDocsApp = (pathname = "/") => {
  navigateToApp({
    pathname,
    localPort: 3000,
    targetOrigin: docsAppOrigin
  });
};
