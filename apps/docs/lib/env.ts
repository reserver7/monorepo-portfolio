import { createClientEnv } from "@repo/shared-client";

const normalizeOptional = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const docsClientEnv = {
  ...createClientEnv(process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_DEFAULT_DOC_ROLE),
  editorAccessKey: normalizeOptional(process.env.NEXT_PUBLIC_EDITOR_ACCESS_KEY)
};
