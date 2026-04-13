"use client";

import { createAppProviders } from "@repo/theme";

export const Providers = createAppProviders({
  queryClientConfig: {
    defaultOptions: {
      queries: { retry: 1 }
    }
  },
  fallbackTitle: "__APP_TITLE__ 화면에서 오류가 발생했습니다.",
  fallbackDescription: "잠시 후 다시 시도하거나 새로고침해 주세요."
});
