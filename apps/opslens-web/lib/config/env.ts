import { normalizeUrl } from "@repo/utils/string";

const normalizeAppTitle = (value: string | undefined): string => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "OpsLens AI";
};

export const opslensClientEnv = {
  appTitle: normalizeAppTitle(process.env.NEXT_PUBLIC_APP_TITLE),
  apiUrl: normalizeUrl(process.env.NEXT_PUBLIC_API_URL, "http://localhost:4100/graphql"),
  appUrl: normalizeUrl(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3002")
};
