"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography, toast } from "@repo/ui";
import { loginWithOAuth, readAuthSession } from "@/lib/auth";

const resolveNextPath = (rawNext: string | null): string => {
  if (!rawNext) return "/";
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith("/")) return "/";
  if (trimmed.startsWith("/login")) return "/";
  if (trimmed.startsWith("/oauth")) return "/";
  return trimmed;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
};

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => resolveNextPath(searchParams.get("next")), [searchParams]);

  useEffect(() => {
    const session = readAuthSession();
    if (session?.accessToken) {
      router.replace(nextPath);
      return;
    }

    void loginWithOAuth()
      .then(() => {
        toast.success("로그인되었습니다.");
        router.replace(nextPath);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error, "소셜 로그인 처리에 실패했습니다."));
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      });
  }, [nextPath, router]);

  return (
    <Box className="bg-surface-elevated flex min-h-screen items-center justify-center p-[var(--space-4)]">
      <Box className="grid justify-items-center gap-[var(--space-2)] text-center">
        <Typography as="p" className="text-foreground text-body-lg font-semibold">
          Signing in...
        </Typography>
        <Typography as="p" color="muted" className="text-body-sm">
          Please wait a moment.
        </Typography>
      </Box>
    </Box>
  );
}

