import { createClientEnv } from "@repo/shared-client";

export const docsClientEnv = {
  ...createClientEnv(process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_DEFAULT_DOC_ROLE)
};
