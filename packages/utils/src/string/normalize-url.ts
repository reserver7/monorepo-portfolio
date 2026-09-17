import { trimTrailingSlash } from "./trim-trailing-slash";

export const normalizeUrl = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim();
  return trimmed ? trimTrailingSlash(trimmed) : fallback;
};
