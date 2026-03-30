"use client";

import { configureHttpAuth, setHttpAccessToken, subscribeHttpUnauthorized } from "@repo/http";
import { QueryClientProvider, createAppQueryClient } from "@repo/react-query";
import { ErrorBoundary, Toaster, useToast } from "@repo/ui";
import { useEffect, useState } from "react";

const HTTP_ACCESS_TOKEN_STORAGE_KEY = "app.accessToken";

export function Providers({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [queryClient] = useState(
    () =>
      createAppQueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000
          }
        }
      })
  );

  useEffect(() => {
    configureHttpAuth({
      getAccessToken: () => {
        if (typeof window === "undefined") {
          return null;
        }

        const token = window.localStorage.getItem(HTTP_ACCESS_TOKEN_STORAGE_KEY);
        return token && token.trim().length > 0 ? token : null;
      }
    });

    return subscribeHttpUnauthorized(() => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(HTTP_ACCESS_TOKEN_STORAGE_KEY);
      }
      setHttpAccessToken(null);
      toast.warning("인증이 만료되었습니다.", "다시 로그인해 주세요.");
    });
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        fallbackTitle="OpsLens AI 화면에서 오류가 발생했습니다."
        fallbackDescription="잠시 후 다시 시도하거나 새로고침해 주세요."
        onReset={() => window.location.reload()}
      >
        {children}
      </ErrorBoundary>
      <Toaster />
    </QueryClientProvider>
  );
}
