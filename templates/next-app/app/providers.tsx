"use client";

import { createAppProviders } from "@repo/theme";

export const Providers = createAppProviders({
  queryClientConfig: {
    defaultOptions: {
      queries: { retry: 1 }
    }
  },
  fallbackTitle: "An error occurred in __APP_TITLE__.",
  fallbackDescription: "Try again shortly or refresh the page."
});
