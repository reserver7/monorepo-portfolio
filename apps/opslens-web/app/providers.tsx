"use client";

import { configureOpslensClient } from "@repo/opslens";
import { createAppProviders } from "@repo/theme";
import { OpsFilterStoreProvider } from "@/features/stores";
import { opslensClientEnv } from "@/lib/config";

configureOpslensClient({ apiUrl: opslensClientEnv.apiUrl });

export const Providers = createAppProviders({
  queryClientConfig: {
    defaultOptions: {
      queries: { staleTime: 15_000 }
    }
  },
  fallbackTitle: "OpsLens AI 화면에서 오류가 발생했습니다.",
  fallbackDescription: "잠시 후 다시 시도하거나 새로고침해 주세요.",
  wrapChildren: (children) => <OpsFilterStoreProvider>{children}</OpsFilterStoreProvider>
});
