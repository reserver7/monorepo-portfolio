import { createClientEnv } from "@repo/collab-client";

export const docsClientEnv = {
  ...createClientEnv(process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_DEFAULT_DOC_ROLE)
};
